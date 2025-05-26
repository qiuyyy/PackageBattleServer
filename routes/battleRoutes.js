const express = require('express');
const router = express.Router();
const { formatResponse, saveUserItem, getRandomWeaponBlueprint, formatItemsToObj, formatItemsToArr } = require('../tools/CustomUtils');
const GameConfig = require('../tools/GameConfig');

// 开始战斗
router.post('/battle/sendMissBegin', async (req, res) => {
    // 保存进行中战斗信息
    const user = req.user;
    const battleId = Math.floor(100000 + Math.random() * 900000); // 生成六位随机数
    let randomReward = []; // 随机奖励
    // 随机奖励生成并保存
    req.body.reward = req.body.reward.filter(item => {
        if (item[0] == GameConfig.ItemId.WeaponBlueprintRandom) { // 武器随机图纸
            randomReward = getRandomWeaponBlueprint(item[1]); // 生成随机武器图纸
            return false;
        } else if (item[0] == GameConfig.ItemId.EquipBlueprintRandom) { // 装备随机图纸
            // TODO: 生成随机装备图纸
            return false;
        }
        return true;
    })
    req.body.reward = req.body.reward.concat(randomReward);

    // 保存战斗信息
    user.battleInfo = {
        battleid: battleId,
        ...req.body
    }; 
    // 减少体力
    if (!saveUserItem(user, GameConfig.ItemId.Power, - GameConfig.battlePowerCost)) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "item not enough"));
    }
    await user.save();
    res.json(formatResponse({
        battleid: battleId,
        kv: {
            Power: user.Power, // 体力
            PowerRecoveryStarTime: user.Power < user.MaxPower ? new Date().getTime() : 0, 
        },
        init_battle_coin: 0, // 初始战斗币
    }));
});

// 战斗结束
router.post('/battle/sendMissResult', async (req, res) => {
    const user = req.user;
    if (req.body.battleid == user.battleInfo.battleid) { // 验证战斗ID是否一致
        if (user.battleInfo.battle_type == 1) { // 普通关卡
            let oldLevel = user.Level; // 旧等级
            let reward = user.battleInfo.reward; // 奖励物品
            if (req.body.Pass) { // 战斗成功
                // 保存战斗信息
                user.ChapterID = Math.max(user.battleInfo.configId + 1, user.ChapterID); // 保存通关章节
                user.ChapterWaveId = 0; // 保存通关波次
                // 保存奖励物品
                user.battleInfo.reward.forEach(item => {
                    saveUserItem(user, item[0], item[1]);  
                })
            } else { // 战斗失败
                reward = [];
                // 保存战斗信息
                user.ChapterWaveId = req.body.ChapterWaveId; // 保存通关波次
            }
            // 波次奖励(奖励数=配置*波次数)
            let rewardObj = formatItemsToObj(reward); // 奖励物品对象
            if (req.body.RealWave > 1) { // 不是第一波
                user.battleInfo.waveReward.forEach(item => { 
                    let a = saveUserItem(user, item[0], item[1] * (req.body.RealWave-1));
                    a.forEach(i => {
                        if (rewardObj[i[0]]) { // 存在则增加数量
                            rewardObj[i[0]] += i[1]; // 增加数量
                        } else { // 不存在则添加
                            rewardObj[i[0]] = i[1]; // 添加
                        }
                    })
                })
            }
            reward = formatItemsToArr(rewardObj); // 奖励物品数组
            // 固定奖励
            user.battleInfo.fixedReward.forEach(item => { 
                reward.push(item);
                saveUserItem(user, item[0], item[1]); // 增加固定奖励
            })
            // 升级奖励
            let lvUpReward = [];
            for (let lv = oldLevel; lv < user.Level; lv++){
                GameConfig.levelConfig[lv - 1].Rewards.forEach(i => {
                    saveUserItem(user, i[0], i[1])
                });
                lvUpReward = lvUpReward.concat(GameConfig.levelConfig[lv - 1].Rewards);
            }
            await user.save();
            res.json(formatResponse({
                items: reward,
                kv: {
                    ChapterID: user.ChapterID,
                    ChapterWaveId: user.ChapterWaveId,
                    Exp: user.Exp, // 经验
                    Level: user.Level, // 等级
                    // Power: user.Power, // 体力
                    ChapterMaxSurvivalTime: 0,
                    PowerRecoveryStarTime: 0, 
                },
                levelup: {
                    LevelOld: oldLevel, // 旧等级
                    LevelNew: user.Level, // 新等级
                    Exp: user.Exp, // 经验
                    Rewards: lvUpReward, // 升级奖励
                    
                }
            }));
        } else if (req.body.battle_type == 3){ // 精英关卡
            if (req.body.Pass) { // 战斗成功
                // 保存战斗信息
                let mission = user.api.missionChallengeInfo.find(item => item.task_id == req.body.configId); // 查找精英关卡信息
                if (!mission) { // 不存在则创建
                    user.api.missionChallengeInfo.push({ task_id: req.body.configId, draw: 0, num: 1 }); // 保存精英关卡信息
                } else { // 存在则增加数量
                    mission.num += 1; // 增加数量
                }
            }
            let reward = user.battleInfo.reward; // 奖励物品
            await user.save();
            res.json(formatResponse({
                items: reward,
                kv: {
                    ChapterID: user.ChapterID,
                    ChapterWaveId: user.ChapterWaveId,
                    Exp: user.Exp, // 经验
                    Level: user.Level, // 等级
                    Power: user.Power, // 体力
                    ChapterMaxSurvivalTime: 0,
                    PowerRecoveryStarTime: 0, 
                },
                missionChallengeInfo: user.api.missionChallengeInfo,
            }));
        }
    } else {
        res.json(formatResponse({}, GameConfig.NetCode.FAIL, "battleid not match"));
    }
});

// 获取宝箱奖励
router.post('/battle/drawMissionBoxAny', async (req, res) => {
    const user = req.user;
    let randomReward = [];
    // 保存奖励物品
    req.body.MainReward = req.body.MainReward.filter(item => {
        if (item[0] == GameConfig.ItemId.WeaponBlueprintRandom) { // 武器随机图纸
            randomReward = getRandomWeaponBlueprint(item[1]); // 生成随机武器图纸
            randomReward.forEach(item => { // 保存随机武器图纸
                saveUserItem(user, item[0], item[1]);
            })
            return false;
        } else if (item[0] == GameConfig.ItemId.EquipBlueprintRandom) { // 装备随机图纸
            // TODO: 生成随机装备图纸
            return false;
        } else { // 普通物品
            saveUserItem(user, item[0], item[1]);
            return true;
        }
    })
    // 保存领取信息
    user.DrawChapterBoxAny = user.DrawChapterBoxAny == "" ? user.DrawChapterBoxAny + req.body.ID : user.DrawChapterBoxAny + "," + req.body.ID;
    await user.save();
    res.json(formatResponse({
        items: req.body.MainReward.concat(randomReward),
        kv: {
            // ChapterID: req.body.ChapterId,
            ChapterID: 0,
            ChapterMaxSurvivalTime: 0,
            DrawChapterBoxAny: user.DrawChapterBoxAny,
        }
    }));
});

// 获取精英宝箱奖励
router.post('/battle/drawchallenge', async (req, res) => {
    const user = req.user;
    // 保存奖励物品
    req.body.Reward.forEach(item => {
        saveUserItem(user, item[0], item[1]);
    })
    // 保存领取信息
    let challengeInfo = user.api.missionChallengeInfo.find(item => item.task_id == req.body.ChallengeID);
    if (!challengeInfo) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "nothing to draw"))
    } else {
        if (challengeInfo.draw == 1) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "already draw"))
        } else {
            challengeInfo.draw = 1; // 标记为已领取
        }
    }
    await user.save();
    res.json(formatResponse({
        items: req.body.Reward,
    }));
})

module.exports = router;