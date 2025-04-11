const express = require('express');
const User = require('../models/User');
const { formatResponse ,saveUserItem} = require('../tools/CustomUtils');
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
  // user.api.missionChallengeInfo = [{task_id: 101, draw: 0, num: 1}]
  // ===============================

  res.json(formatResponse({
    info: {
      ...user,
      ServTimestap: Math.floor(new Date().getTime() / 1000), // 服务器时间戳
    },
  }));
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

// 保存已开放功能
router.post('/user/functionopen', async (req, res) => {
  const user = req.user;
  user.function_open = user.function_open.concat(req.body.functionopen || []);
  await user.save();
  res.json(formatResponse({}));
})

// 购买体力
router.post('/user/buyPower', async (req, res) => {
  const user = req.user;
  if (req.body.diamond) { // 钻石购买
    if (!saveUserItem(user, GameConfig.ItemId.Diamond, - GameConfig.gemGetPowerCost)) {
      return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "item not enough"));
    }
    saveUserItem(user, GameConfig.ItemId.Power, GameConfig.gemGetPowerCount)
  } else { // 广告购买
    saveUserItem(user, GameConfig.ItemId.Power, GameConfig.adGetPowerCount)
  }
  await user.save();
  res.json(formatResponse({
    items:[
      [GameConfig.ItemId.Power, req.body.diamond ? GameConfig.gemGetPowerCount : GameConfig.adGetPowerCount, true, false]
    ],
    kv: {
      PowerRecoveryStartTime: user.Power < user.MaxPower ? new Date().getTime() : 0,
      AdPowerDrawTime: 0,
      Power: user.Power, //目前体力数
    }
  }));
})

module.exports = router;