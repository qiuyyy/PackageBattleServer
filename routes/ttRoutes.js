// toutiao相关api
var GameConfig = require("../tools/GameConfig");
const express = require('express');
const router = express.Router();
const { formatResponse, getRandomWeapon, saveUserItem, getRandomByProb, checkItemIsEnough } = require('../tools/CustomUtils');
// 侧边栏入口奖励
router.post('/user/drawSideBarReward', async (req, res) => {
    const user = req.user;
    try {
        if (user.toutiaoSideBarOnce === 1) { // 已领取
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"));
        }
        let obj = saveUserItem(user, GameConfig.ItemId.Diamond, 100);
        user.toutiaoSideBarOnce = 1; // 已领取
        await user.save();
        res.json(formatResponse({
            ...obj,
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});
module.exports = router;