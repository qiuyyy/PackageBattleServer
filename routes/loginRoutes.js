const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey} = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库
const GameConfig = require('../tools/GameConfig');

router.post('/user/login', async (req, res) => {
    // 拿取uuid作为openid
    const openid = req.body.uuid;
    if (!openid) {
      return res.status(500).json({ error: 'Failed to get openid' });
    }

    var new_player = false;
    var user = await User.findOne({ openid: openid });
    var previousLoginTime = null; // 上次登录时间
    console.log("login find user:", user);
    if(!user){
      // 新玩家
      new_player = true;
      user = new User({ 
        nickname: "玩家" + openid.split("-")[0], // 根据openid生成一个昵称,
        openid: openid,
        last_login_time: new Date().getTime(), // 更新登录时间,
        Regdate: new Date().getTime(), // 添加注册时间
        equips: [
          { cfgid: 2101,color_cfgid:0,id:18945860,lv: 1, star:0},
          { cfgid: 2102,color_cfgid:0,id:18945861,lv: 1, star:0},
          { cfgid: 2103,color_cfgid:0,id:18945862,lv: 1, star:0},
          { cfgid: 2104,color_cfgid:0,id:18945863,lv: 1, star:0},
          { cfgid: 2201,color_cfgid:0,id:18945863,lv: 1, star:0},
          { cfgid: 2202,color_cfgid:0,id:18945863,lv: 1, star:0},
          { cfgid: 2203,color_cfgid:0,id:18945863,lv: 1, star:0},
          { cfgid: 2205,color_cfgid:0,id:18945863,lv: 1, star:0},
          { cfgid: 2207,color_cfgid:0,id:18945863,lv: 1, star:0},
        ], // 初始解锁武器
        equip_table: [
          {equip_id: 2101, unlock: 1},
          {equip_id: 2102, unlock: 1},
          {equip_id: 2103, unlock: 1},
          {equip_id: 2104, unlock: 1},
          {equip_id: 2201, unlock: 1},
          {equip_id: 2202, unlock: 1},
        ], // 初始上阵武器
        magicWeapon: ["M2201"], // 初始解锁神话武器
      });
      await user.save();
    } else {
      previousLoginTime = user.last_login_time; // 保存上次登录时间
      user.last_login_time = new Date().getTime(); // 更新为本次登录时间
      // 计算体力恢复
      if (user.Power < user.MaxPower && user.PowerRecoveryStartTime > 0) { // 未满体力
        const currentTime = Math.floor(new Date().getTime() / 1000); // 当前时间戳
        const recoveryPowerCount = Math.floor((currentTime - user.PowerRecoveryStartTime) / GameConfig.POWER_RECOVERY_CD); // 恢复次数
        if (recoveryPowerCount > 0) { // 恢复次数大于0
          user.Power = Math.min(user.Power + recoveryPowerCount, user.MaxPower); // 恢复体力
          user.PowerRecoveryStartTime = user.PowerRecoveryStartTime + recoveryPowerCount * GameConfig.POWER_RECOVERY_CD; // 更新恢复时间
        }
      }
      if (user.Power >= user.MaxPower) { // 满体力
        user.PowerRecoveryStartTime = 0; // 重置恢复时间
      }
      await user.save();
    }

    // 判断是否为今日首次登录
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // 获取今天零点的时间戳
    if (!previousLoginTime || previousLoginTime < todayStart) { // 今天首次登录
      // 重置每日商店
      user.api.dailyStore = [
        {Count: 10, Discount: 10, Id: 1, ItemId: 1, Left: 2, Price: 1, PriceType: 0, PriceType2: "2,1", Time: 0, priceType2List: [2, 1]},
        {Count: 50, Discount: 10, Id: 2, ItemId: 110, Left: 2, Price: 20, PriceType: 0, PriceType2: "1,1", Time: 0, priceType2List: [1, 1]},
        {Count: 100, Discount: 10, Id: 3, ItemId: 2, Left: 3, Price: 50, PriceType: 2, PriceType2: "0,0,0", Time: 0, priceType2List: [0, 0, 0]},
      ]
      // 重置每日次数
      user.api.TodayCounts = { RereshStoreNum: 0 }
      await user.save();
    }

    // 生成token
    const token = jwt.sign(
      { openid: user.openid }, 
      getSercetKey(),
      { expiresIn: '1h' } // token有效期1小时
    );

    // 返回数据给客户端
    res.json(formatResponse({
      openid,
      new_player,
      last_login_time: previousLoginTime,
      token,
    }));
});

// 公告？
router.post('/system/notice', async (req, res) => {
  const user = req.user.toObject();
  res.json(formatResponse({}));
});
module.exports = router;