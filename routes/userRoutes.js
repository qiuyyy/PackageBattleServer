const express = require('express');
const User = require('../models/User');
const { formatResponse ,saveUserItem, saveUserItemList, checkItemIsEnough,achieveTaskRecord, getConfigData} = require('../tools/CustomUtils');
const router = express.Router();
var GameConfig = require("../tools/GameConfig");

router.post('/user/getClientData', async (req, res) => {
  res.json(formatResponse({}));
})

// 获取用户数据
router.post('/user/playerInfo', async (req, res) => {
  const user = req.user.toObject();

  // FIXED: 修改用户数据，用于测试====
  // user.ChapterID = 5;
  // user.Level = 20;
  // user.api.bagInfo.push({ Itemid: 6, Num: 1000 });
  // req.user.api.bagInfo.push({ Itemid: 6, Num: 1000 });
  // user.TalentLeft = 1000;
  // await req.user.save();
  // user.api.missionChallengeInfo = [{task_id: 101, draw: 0, num: 1}]
  // ===============================

  // 修复离线时间
  if (user.DrawOfflineTime == 0) {
    user.DrawOfflineTime = Math.floor(new Date().getTime() / 1000);
    await req.user.save();
  }
  // FIXME: 小游戏为旧版前端代码 需要修改返回数据
  if (req.body.subChannel == "ttxd") {
    user.RoleEquips = [];
    res.json(formatResponse({
      info: {
        ...user,
        ServTimestap: Math.floor(new Date().getTime() / 1000), // 服务器时间戳
      },
    }));
  } else {
    res.json(formatResponse({
      info: {
        ...user,
        ServTimestap: Math.floor(new Date().getTime() / 1000), // 服务器时间戳
      },
    }));
  }
});

// 返回主页刷新信息
router.post('/user/backToLobby', async (req, res) => {
  const user = req.user.toObject();
  res.json(formatResponse({
    info: {
      _Diamond: user.Diamond,
      _Gems: user.Gems,
      // _PigBankId: user.PigBankId,
      _Power: user.Power,
      _TalentLeft: user.TalentLeft,
      _TalentRight: user.TalentRight,
      allapidata: user.api,
      ServTimestap: new Date().getTime(), // 服务器时间戳
    },
  }));
});

// 保存用户数据(弃用)
router.post('/user/savePlayerInfo', async (req, res) => {
  const user = req.user;
  try {
    // for (const key in req.body) {
    //   if (key in user && key !== '_id' && key !== '__v') { // 防止更新敏感字段
    //     user[key] = req.body[key];
    //   }
    // }
    // await user.save();
    res.json(formatResponse({}));
  } catch (err) {
    res.status(500).json({ errcode: 1, message: 'Server error' + err });
  }
});

// 获取用户背包
router.post('/bag/info', async (req, res) => {
  const user = req.user.toObject();
  res.json(formatResponse(user.api.bagInfo)); // 背包物品列表 
});

// 使用物品
router.post('/user/useItem', async (req, res) => {
  const user = req.user;
  if (req.body.count <= 0) {
    return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL"));
  }
  let obj;
  if (!(obj = saveUserItem(user, req.body.id, - req.body.count))) {
    return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
  }
  await user.save();
  res.json(formatResponse({
    ...obj,
  }));
});

// 保存已开放功能
router.post('/user/functionopen', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL"));
    }
    user.function_open = user.function_open.concat(req.body.functionopen || []);
    await user.save();
    res.json(formatResponse({}));
  } catch (err) {
    res.status(500).json(formatResponse({}, GameConfig.NetCode.FAIL, err.message));
  }
})

// 购买体力
router.post('/user/buyPower', async (req, res) => {
  const user = req.user;
  if (req.body.diamond) { // 钻石购买
    if (!saveUserItem(user, GameConfig.ItemId.Diamond, - GameConfig.gemGetPowerCost)) {
      return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
    }
    user.TodayCounts.BuyPowerGemCount += 1;
    saveUserItem(user, GameConfig.ItemId.Power, GameConfig.gemGetPowerCount)
  } else { // 广告购买
    user.TodayCounts.BuyPowerVideoCount += 1;
    saveUserItem(user, GameConfig.ItemId.Power, GameConfig.adGetPowerCount)
  }
  achieveTaskRecord(user, GameConfig.TaskType.BuyOrAdGetPower);
  await user.save();
  res.json(formatResponse({
    items:[
      [GameConfig.ItemId.Power, req.body.diamond ? GameConfig.gemGetPowerCount : GameConfig.adGetPowerCount, true, false]
    ],
    kv: {
      PowerRecoveryStartTime: user.PowerRecoveryStartTime,
      AdPowerDrawTime: 0,
      Power: user.Power, //目前体力数
    }
  }));
})

// 升级天赋
router.post('/talent/upgrade', async (req, res) => {
  const user = req.user;
  if (req.body.cost && !saveUserItem(user, req.body.cost[0], - req.body.cost[1])){
      return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
  }
  if (req.body.id < 2000) { // 普通天赋
    user.TalentLeft = req.body.id;
    achieveTaskRecord(user, GameConfig.TaskType.UnlockCommonTalent);
  } else { // 特殊天赋
    user.TalentRight = req.body.id;
  }

  await user.save();
  res.json(formatResponse({
    items:[
      [req.body.cost[0], - req.body.cost[1]]
    ],
    kv: {
      TalentLeft: user.TalentLeft,
      TalentRight: user.TalentRight
    }
  }));
})

// 一键升级天赋
router.post('/talent/upgradeOneKey', async (req, res) => {
  const user = req.user;
  // 检查是否有足够的消耗
  if (!req.body.cost || !checkItemIsEnough(user, req.body.cost)) {
    return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
  }
  if (req.body.leftTalentId > user.TalentLeft) { 
    // 升级普通天赋
    user.TalentLeft = req.body.leftTalentId;
  }
  if (req.body.rigthTalentId > user.TalentRight) { 
    // 升级特殊天赋
    user.TalentRight = req.body.id;
  }
  // 扣除消耗
  let obj = saveUserItemList(user, req.body.cost);

  await user.save();
  res.json(formatResponse({
    ...obj,
    kv: {
      TalentLeft: user.TalentLeft,
      TalentRight: user.TalentRight
    }
  }));
})

// 食堂信息
router.post("/restaurant/info", async (req, res) => {
  const maxCount = 60; //存储餐食上限
  const user = req.user;
  const now = new Date();
  const nowTime = Math.floor(now.getTime() / 1000); //当前时间戳
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); //今日凌晨的时间戳（毫秒）
  let todayTime = Math.floor((now.getTime() - midnight) / 1000); //从今日凌晨到现在
  let restConfig = getConfigData("Restaurant");
  if (!user.Restaurant || !user.Restaurant.NextTime) {
    // 初始化食堂信息
    let nextCfg = restConfig.find(rest => {
      return rest.GetBootyTime > todayTime;
    }); // 下次制作餐食数据
    if (!nextCfg) {
      // 过了夜宵制作时间 下次制作转天早餐
      nextCfg = restConfig[0];
      midnight = midnight + 24 * 3600000;
    } 
    const nextTime = Math.floor((midnight + nextCfg.GetBootyTime * 1000) / 1000); //下次制作完成时间戳
    user.Restaurant = {
      Foods: [],
      NextTime: nextTime,
    }
  }
  
  // 制作餐食
  while (user.Restaurant.NextTime <= nowTime) {
    const curDate = new Date(user.Restaurant.NextTime * 1000);
    const curMidnight = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate()).getTime();
    let curDur = Math.floor((curDate.getTime() - curMidnight) / 1000); // 出餐时间距当日凌晨时间
    let curCfg = restConfig.find(rest => {
      return rest.GetBootyTime == curDur;
    }); // 本次制作餐食数据
    user.Restaurant.Foods.push([
      curCfg.Id,
      user.Restaurant.NextTime + curCfg.SaveTime,
    ])
    if (user.Restaurant.Foods.length > maxCount) {
      // 超过最大数量 去掉第一个
      user.Restaurant.Foods.shift();
    }
    // 计算下次制作时间
    if (curCfg.Id == 4) {
      // 需要转天制作
      let nextCfg = restConfig.find(rest => {
        return rest.Id == 1;
      }); // 下次制作餐食数据
      user.Restaurant.NextTime = curMidnight / 1000 + 24*3600 + nextCfg.GetBootyTime;
    } else {
      // 当天制作
      let nextCfg = restConfig.find(rest => {
        return rest.Id == curCfg.Id + 1;
      }); // 下次制作餐食数据
      user.Restaurant.NextTime = curMidnight / 1000 + nextCfg.GetBootyTime;
    }
  }

  // 检查过期餐食
  user.Restaurant.Foods = user.Restaurant.Foods.filter(food => {
    return food[1] >= nowTime;
  })
  await user.save();

  res.json(formatResponse({
    Restaurant: user.Restaurant,
  }));
})

// 领取餐食
router.post('/restaurant/claim', async (req, res) => {
  const user = req.user;
  const now = new Date();
  const nowTime = Math.floor(now.getTime() / 1000); //当前时间戳
  let obj;
  if (req.body.index == 0) {
    // 领取全部
    let rewards = [];
    user.Restaurant.Foods.forEach(food => {
      if (food[1] >= nowTime) { // 未过期
        let foodCfg = getConfigData("Restaurant").find(f => {
          return f.Id == food[0];
        })
        foodCfg && rewards.push(foodCfg.Reward);
      }
    })
    user.Restaurant.Foods = [];
    obj = saveUserItemList(user, rewards);
  } else {
    // 领取指定
    let food = user.Restaurant.Foods[req.body.index - 1];
    if (!(food && food[1] >= nowTime)) {
      // 没有餐食 || 餐食已过期
      return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"));
    }
    user.Restaurant.Foods = user.Restaurant.Foods.splice(req.body.index - 1, 1);
    let foodCfg = getConfigData("Restaurant").find(f => {
      return f.Id == food[0];
    })
    obj = saveUserItemList(user, [foodCfg.Reward]);
  }
  await user.save();
  res.json(formatResponse({
    ...obj,
    Restaurant: user.Restaurant,
  }));
})

// 礼包兑换码
router.post('/user/giftCode', async (req, res) => {
  const user = req.user;
  return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "CODE_IS_ERROR"));
})


module.exports = router;