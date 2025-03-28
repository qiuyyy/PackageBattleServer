const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey } = require('../tools/CustomUtils');
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
      new_player = false;
      user = new User({ 
        openid: openid,
        last_login_time: new Date().getTime(), // 上次登录时间,
        Regdate: new Date().getTime(), // 添加注册时间
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
  module.exports = router;