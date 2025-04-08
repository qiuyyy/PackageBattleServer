const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey } = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库

// 开始战斗
router.post('/battle/sendMissBegin', async (req, res) => {
    res.json(formatResponse({}));
});

// 战斗结果
router.post('/battle/sendMissResult', async (req, res) => {
    res.json(formatResponse({}));
});

// 领取奖励
router.post('/battle/drawMissionBoxAny', async (req, res) => {
    
    res.json(formatResponse({}));
});

module.exports = router;