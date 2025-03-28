const express = require('express');
const User = require('../models/User');
const { formatResponse } = require('../tools/CustomUtils');
const router = express.Router();

router.post('/user/getClientData', async (req, res) => {
  res.json(formatResponse({}));
})

// 获取用户数据
router.post('/user/playerInfo', async (req, res) => {
  res.json(formatResponse({
    info: {
      ...req.user.toObject(),
      ServTimestap: new Date().getTime(), // 服务器时间戳
    },
  }));
});

// 保存用户数据
router.post('/set_cloud_user_data', async (req, res) => {
  const {userid, key, value } = req.body;
  try {
    let user = await User.findOne({ userId: userid });
    if (!user) {
      user = new User({ userId: userid });
    }
    user[key] = value;
    user.version += 1;
    await user.save();
    console.log("cerat user:" + user);
    res.json({ errcode: 0, message: 'User data saved successfully' });
  } catch (err) {
    res.status(500).json({ errcode: 1, message: 'Server error' });
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