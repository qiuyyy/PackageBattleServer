const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getRandomWeapon } = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库
var GameConfig = require("../tools/GameConfig");

// 上阵武器
router.post('/equip/tableWear', async (req, res) => {
    const user = req.user;
    try {
        // 找到已解锁的装备信息
        let equip = user.equips.find(e => e.cfgid === req.body.cfgid);
        if (equip) {
            // 上阵装备
            user.equip_table[req.body.pos] = {equip_id: req.body.cfgid, unlock: 1};
            await user.save();
            res.json(formatResponse({}));
        } else if (req.body.cfgid == 0) {
            // 下阵装备
            user.equip_table[req.body.pos] = {equip_id: 0, unlock: 1};
            await user.save();
            res.json(formatResponse({}));
        } else{
            // 如果未解锁，则返回错误信息
            return res.status(400).json({ errcode: 1, message: 'Equip not unlocked' });
        }
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 武器祈愿配置
router.post('/cardlucky/info', async (req, res) => {
    const user = req.user;
    const numLimit = [8, 30]; //武器数量界限
    let rewards = user.cardlucky.lucky_rewards;
    if (!rewards || rewards.length == 0) {
        // 根据品质获取三个随机武器
        rewards = [];
        for (let i = 0; i < 3; i++) {
            let maxQuality = user.cardlucky.luckyQuality;
            let quality = Math.floor(Math.random() * (maxQuality - 3 + 1)) + 3; // 随机品质
            let weaponId = getRandomWeapon(quality); // 获取随机武器
            if (weaponId) rewards.push([weaponId, Math.floor(Math.random() * (numLimit[1] - numLimit[0] + 1)) + numLimit[0]]); // 随机数量
        }
    }
    user.save();
    res.json(formatResponse({
        refresh_time: new Date().getTime() + 30 * 3600000, //TODO: 武器祈愿刷新时间
        info: {
            rate: 0,
            lucky_rewards: rewards, // 奖品列表[id, num]
            draw_reward_idx: user.cardlucky.draw_reward_idx, // 已获得奖励
        },
        client: {
            totalLuckyNum: user.cardlucky.totalLuckyNum,
            curLuckyNum: user.cardlucky.curLuckyNum,
            luckyQuality: 4, // 最高品质
            costDiamond: [89, 269], //第二，三次抽取花费钻石
            costGold: 100,
            rateList: [1, 2, 3], // 奖励倍数选项
        },
        diamondBoxInfo: {
            chuanshuo_num: 0,
            one_cost: 0,
            ten_cost: 0,
            shenhua_num: 0,
        }, //钻石祈愿需要，暂不开启
    }));
});

// 武器祈愿抽取结果
router.post('/cardlucky/start', async (req, res) => {
    const user = req.user;
    res.json(formatResponse({
        items: [
            [2, -100],
            [3210, 26]
        ], // 物品增减
        reward: [3210, 26], //获得奖励    
    }));
});


module.exports = router;