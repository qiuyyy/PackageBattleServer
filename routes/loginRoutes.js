const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey} = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库

router.post('/user/login', async (req, res) => {
    // 拿取uuid作为openid
    const openid = req.body.uuid;
    if (!openid) {
      return res.status(500).json({ error: 'Failed to get openid' });
    }

    var new_player = false;
    var user = await User.findOne({ openid: openid });
    console.log("login find user:", user);
    if(!user){
      // 新玩家
      new_player = true;
      user = new User({ 
        nickname: "玩家" + openid.split("-")[0], // 根据openid生成一个昵称,
        openid: openid,
        last_login_time: new Date().getTime(), // 上次登录时间,
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
      user.last_login_time = new Date();
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
      last_login_time: user.last_login_time,
      token,
    }));
});

// 公告？
router.post('/system/notice', async (req, res) => {
  const user = req.user.toObject();
  res.json(formatResponse({}));
});
module.exports = router;