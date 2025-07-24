const express = require('express');
const User = require('../models/User');
const { formatResponse ,achieveTaskRecord} = require('../tools/CustomUtils');
const router = express.Router();
const GameConfig = require("../tools/GameConfig");

router.post('/client/configs', async (req, res) => {
  res.json(formatResponse({}));
})

// 看广告
router.post('/client/watchAd', async (req, res) => {
  const user = req.user;
  achieveTaskRecord(user, GameConfig.TaskType.WatchAd);
  await user.save();
  res.json(formatResponse({}));
})

router.post('/server/getServerList', async (req, res) => {
  res.json(formatResponse({user_servers: []}));
})


module.exports = router;