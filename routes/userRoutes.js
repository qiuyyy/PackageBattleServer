const express = require('express');
const User = require('../models/User');
const { formatResponse } = require('../tools/CustomUtils');
const router = express.Router();

router.post('/user/getClientData', async (req, res) => {
  res.json(formatResponse({}));
})

// 获取用户数据
router.post('/user/playerInfo', async (req, res) => {
  const user = req.user.toObject();

  // FIXED: 修改用户数据，用于测试====
  user.ChapterID = 3;
  // ===============================

  res.json(formatResponse({
    info: {
      ...user,
      ServTimestap: new Date().getTime(), // 服务器时间戳
    },
  }));
});

// 保存用户数据
router.post('/user/savePlayerInfo', async (req, res) => {
  const user = req.user;
  try {
    for (const key in req.body) {
      if (key in user && key !== '_id' && key !== '__v') { // 防止更新敏感字段
        user[key] = req.body[key];
      }
    }
    await user.save();
    res.json(formatResponse({}));
  } catch (err) {
    res.status(500).json({ errcode: 1, message: 'Server error' + err });
  }
});

// 获取引导数据
router.get('/get_cloud_user_GuideConfig', async (req, res) => {
  const {userId } = req.query;

  try {
    const user = await User.findOne({ userId: userId });
    console.log("GuideConfiguser:" + user);
    if (!user) {
      return res.status(404).json({ errcode: 1, message: 'User not found' });
    }

    res.json({ errcode: 0, data: user.guideConfig});
  } catch (err) {
    res.status(500).json({ errcode: 1, message: 'Server error' });
  }
});

module.exports = router;