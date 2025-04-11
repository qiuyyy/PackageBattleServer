const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getRandomWeapon, saveUserItem, getRandomByProb, checkItemIsEnough } = require('../tools/CustomUtils');
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

// 武器升级
router.post('/equip/upLevel', async (req, res) => {
    const user = req.user;
    try {
        // 找到已解锁的装备信息
        let index = 0; // 武器索引
        let equip = user.equips.find((e, i) => {
            // 找到武器
            if (e.cfgid === req.body.cfgid) {
                index = i; // 保存索引
                return true;
            }
            return false;
        });
        if (!equip) { // 未解锁
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "equip not found"));
        }
        // 检查材料是否充足
        if (!checkItemIsEnough(user, req.body.costItems)) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "item not enough"));
        }
        // 扣除材料
        req.body.costItems.forEach(item => {
            saveUserItem(user, item[0], - item[1]);
        })
        // 装备升级
        equip.lv += 1;
        user.equips[index] = equip; // 保存
        await user.save();
        res.json(formatResponse({
            equip: equip, // 武器信息
            items: req.body.costItems.map(item => {
                return [item[0], - item[1]];
            }), // 扣除的材料
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 武器祈愿刷新
router.post('/cardlucky/refresh', async (req, res) => {
    const user = req.user;
    // 检查是否有足够的货币
    if (!saveUserItem(user, GameConfig.ItemId.Diamond, - GameConfig.luckyRefreshCostDiamond)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "item not enough"));
    }
    const numLimit = [8, 30]; //武器数量界限
    // 初始化数据
    user.cardlucky.lucky_rewards = []; // 重置奖品列表
    user.cardlucky.draw_reward_idx = []; // 重置已获得奖励
    user.cardlucky.rate = 0; // 重置倍率
    // 根据品质获取三个随机武器
    let rewards = [];
    // 可随机的品质概率列表
    let probList = {};
    for (let index = GameConfig.weaponQuality.QUALITY_1; index <= user.cardlucky.luckyQuality; index++) {
        probList[index] = GameConfig.luckyRewardQualityProb[index];
    }
    for (let i = 0; i < 3; i++) {
        let quality = getRandomByProb(probList); // 随机品质
        let weaponId = getRandomWeapon(quality) + 1000; // 获取随机武器
        if (weaponId) rewards.push([weaponId, Math.floor(Math.random() * (numLimit[1] - numLimit[0] + 1)) + numLimit[0]]); // 随机数量
    }
    user.cardlucky.lucky_rewards = rewards;
    // 更新刷新时间 默认30分钟
    user.cardlucky.refresh_time = new Date().getTime() + GameConfig.luckyRefreshTime;
    user.save();
    res.json(formatResponse({
        info: {
            lucky_rewards: rewards, // 奖品列表[id, num]
            draw_reward_idx: user.cardlucky.draw_reward_idx, // 已获得奖励
            rate: user.cardlucky.rate, // 抽卡倍率
        },
        client: {
            endRefreshTime: Math.floor(user.cardlucky.refresh_time / 1000),
            totalLuckyNum: user.cardlucky.totalLuckyNum,
            curLuckyNum: user.cardlucky.curLuckyNum,
            luckyQuality: user.cardlucky.luckyQuality + 1, // 最高品质
            costDiamond: [89, 269], //第二，三次抽取花费钻石
            costGold: 100,
            rateList: [1, 2, 3], // 奖励倍数选项
            refreshCostDiamond: 5, // 武器祈愿刷新花费钻石
        },
        items: [
            [GameConfig.ItemId.Diamond, - GameConfig.luckyRefreshCostDiamond]
        ]
    }));
})

// 武器祈愿配置
router.post('/cardlucky/info', async (req, res) => {
    const user = req.user;
    const numLimit = [8, 30]; //武器数量界限
    let rewards = user.cardlucky.lucky_rewards;
    if (!rewards || rewards.length == 0 || user.cardlucky.refresh_time < new Date().getTime()) {
        // 根据品质获取三个随机武器
        rewards = [];
        // 可随机的品质概率列表
        let probList = {};
        for (let index = GameConfig.weaponQuality.QUALITY_1; index <= user.cardlucky.luckyQuality; index++) {
            probList[index] = GameConfig.luckyRewardQualityProb[index];
        }
        for (let i = 0; i < 3; i++) {
            // 根据概率获取随机品质
            let quality = getRandomByProb(probList); // 随机品质
            let weaponId = getRandomWeapon(quality) + 1000; // 获取随机武器
            if (weaponId) rewards.push([weaponId, Math.floor(Math.random() * (numLimit[1] - numLimit[0] + 1)) + numLimit[0]]); // 随机数量
        }
        user.cardlucky.lucky_rewards = rewards;
        // 更新刷新时间 默认30分钟
        user.cardlucky.refresh_time = new Date().getTime() + GameConfig.luckyRefreshTime;
    }
    user.save();
    res.json(formatResponse({
        info: {
            lucky_rewards: rewards, // 奖品列表[id, num]
            draw_reward_idx: user.cardlucky.draw_reward_idx, // 已获得奖励
            rate: user.cardlucky.rate, // 抽卡倍率
        },
        client: {
            endRefreshTime: Math.floor(user.cardlucky.refresh_time / 1000),
            totalLuckyNum: user.cardlucky.totalLuckyNum,
            curLuckyNum: user.cardlucky.curLuckyNum,
            luckyQuality: user.cardlucky.luckyQuality + 1, // 最高品质
            costDiamond: [89, 269], //第二，三次抽取花费钻石
            costGold: 100,
            rateList: [1, 2, 3], // 奖励倍数选项
            refreshCostDiamond: 5, // 武器祈愿刷新花费钻石
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
    const costCurrencyTypeMap = [GameConfig.ItemId.Gold, GameConfig.ItemId.Diamond, GameConfig.ItemId.Diamond];
    const costCurrencyCountMap = [100, 89, 269]; // 花费
    // 检查是否有足够的货币
    if (!saveUserItem(user, costCurrencyTypeMap[user.cardlucky.draw_reward_idx.length], - costCurrencyCountMap[user.cardlucky.draw_reward_idx.length] * req.body.rate)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "item not enough"));
    }
    // 保存倍率
    user.cardlucky.rate = req.body.rate || 1; // 抽卡倍率
    // 幸运值增加
    user.cardlucky.curLuckyNum += 1;
    if (user.cardlucky.curLuckyNum > user.cardlucky.totalLuckyNum) {
        // 幸运值达到目标值，下一次抽取，品质+1，幸运值归0，目标幸运值+5
        user.cardlucky.luckyQuality += 1; 
        user.cardlucky.curLuckyNum = 0;
        user.cardlucky.totalLuckyNum += 5;
    }
    // 抽取结果
    let idx = Math.floor(Math.random() * user.cardlucky.lucky_rewards.length); // 随机奖品
    let reward = user.cardlucky.lucky_rewards[idx]; // 奖品
    // 保存已抽取的奖品
    user.cardlucky.draw_reward_idx.push(idx);
    saveUserItem(user, reward[0], reward[1] * user.cardlucky.rate);

    user.save();

    res.json(formatResponse({
        items: [
            [costCurrencyTypeMap[user.cardlucky.draw_reward_idx.length - 1], - costCurrencyCountMap[user.cardlucky.draw_reward_idx.length - 1] * user.cardlucky.rate],
            [reward[0], reward[1] * user.cardlucky.rate]
        ], // 物品增减
        reward: [reward[0], reward[1] * user.cardlucky.rate], //获得奖励    
        client: {
            endRefreshTime: Math.floor(user.cardlucky.refresh_time / 1000),
            totalLuckyNum: user.cardlucky.totalLuckyNum,
            curLuckyNum: user.cardlucky.curLuckyNum,
            luckyQuality: user.cardlucky.luckyQuality, // 最高品质
            costDiamond: [89, 269], //第二，三次抽取花费钻石
            costGold: 100,
            rateList: [1, 2, 3], // 奖励倍数选项
            refreshCostDiamond: GameConfig.luckyRefreshCostDiamond, // 武器祈愿刷新花费钻石
        },
        info: {
            draw_reward_idx: user.cardlucky.draw_reward_idx, // 已获得奖励
            rate: user.cardlucky.rate, // 抽卡倍率
            lucky_rewards: user.cardlucky.lucky_rewards, // 奖品列表[id, num]
        }
    }));
});


module.exports = router;