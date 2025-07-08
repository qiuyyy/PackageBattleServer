const express = require('express');
const router = express.Router();
const { formatResponse, saveUserItem, saveUserItemList, getRandomWeaponBlueprint, formatItemsToObj, formatItemsToArr,pushItemsToList ,achieveTaskRecord} = require('../tools/CustomUtils');
const GameConfig = require('../tools/GameConfig');

// 开始战斗
router.post('/battle/sendMissBegin', async (req, res) => {
    // 保存进行中战斗信息
    const user = req.user;
    const battleId = Math.floor(100000 + Math.random() * 900000); // 生成六位随机数
    

    // 保存战斗信息
    user.battleInfo = {
        battleid: battleId,
        ...req.body
    }; 
    // 减少体力
    if (!saveUserItem(user, GameConfig.ItemId.Power, - GameConfig.battlePowerCost)) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
    }
    achieveTaskRecord(user, GameConfig.TaskType.MissionPaicipation);
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
    achieveTaskRecord(user, GameConfig.TaskType.KillEnemy, req.body.pkg.killEnemy);
    achieveTaskRecord(user, GameConfig.TaskType.KillBoss, req.body.pkg.killBoss);
    if (user.battleInfo && req.body.battleid == user.battleInfo.battleid) { // 验证战斗ID是否一致
        if (user.battleInfo.battle_type == 1) { // 普通关卡
            let oldLevel = user.Level; // 旧等级
            let reward = user.battleInfo.reward; // 奖励物品
            if (req.body.Pass) { // 战斗成功
                if (user.ChapterID == 1) {
                    // 首次通过第一关 用于新手教学
                    // 增加奖励扳手图纸x10 增加金币x100
                    reward = pushItemsToList(reward, [[3101, 10],[GameConfig.ItemId.Gold, 100]]);
                }
                // 保存战斗信息
                user.ChapterID = Math.max(user.battleInfo.configId + 1, user.ChapterID); // 保存通关章节
                user.ChapterWaveId = 0; // 保存通关波次
                if (user.ChapterID == user.battleInfo.configId + 1) {
                    achieveTaskRecord(user, GameConfig.TaskType.MissionOverReach);
                }
            } else { // 战斗失败
                reward = [];
                // 保存战斗信息
                user.ChapterWaveId = req.body.ChapterWaveId; // 保存通关波次
            }
            // 波次奖励(奖励数=配置*波次数)
            if (req.body.RealWave > 1) { // 不是第一波
                reward = pushItemsToList(reward, user.battleInfo.waveReward, req.body.RealWave-1);
            }
            // 固定奖励
            reward = pushItemsToList(reward, user.battleInfo.fixedReward);

            let returnList = saveUserItemList(user, reward);
           
            await user.save();
            res.json(formatResponse({
                ...returnList,
                kv: {
                    ChapterID: user.ChapterID,
                    ChapterWaveId: user.ChapterWaveId,
                    Exp: user.Exp, // 经验
                    Level: user.Level, // 等级
                    // Power: user.Power, // 体力
                    ChapterMaxSurvivalTime: 0,
                    PowerRecoveryStarTime: 0, 
                },
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
        res.json(formatResponse({}, GameConfig.NetCode.FAIL, "BATTLE_ID_NOT_MATCH"));
    }
});

// 获取宝箱奖励
router.post('/battle/drawMissionBoxAny', async (req, res) => {
    const user = req.user;
    // 保存奖励物品
    let returnList = saveUserItemList(user, req.body.MainReward);
    // 保存领取信息
    user.DrawChapterBoxAny = user.DrawChapterBoxAny == "" ? user.DrawChapterBoxAny + req.body.ID : user.DrawChapterBoxAny + "," + req.body.ID;
    await user.save();
    res.json(formatResponse({
        ...returnList,
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
    let returnList = saveUserItemList(user, req.body.Reward);
    
    // 保存领取信息
    let challengeInfo = user.api.missionChallengeInfo.find(item => item.task_id == req.body.ChallengeID);
    if (!challengeInfo) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"))
    } else {
        if (challengeInfo.draw == 1) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"))
        } else {
            challengeInfo.draw = 1; // 标记为已领取
        }
    }
    await user.save();
    res.json(formatResponse({
        ...returnList,
    }));
})

// 获取扫荡信息
router.post('/battle/offlineEarn', async (req, res) => {
    const user = req.user;
    if (user.DrawOfflineTime == 0) {
        user.DrawOfflineTime = Math.floor(new Date().getTime() / 1000);
        await user.save();
    }
    // 可奖励时长
    let rewardHours = Math.floor(((new Date().getTime() / 1000) - user.DrawOfflineTime) / 3600);
    rewardHours = Math.min(24, rewardHours); //最长24小时
    // 根据当前通关数据获取奖励
    let rewards = []; // 巡逻奖励
    let fastRewards = []; //扫荡奖励
    let config = GameConfig.trainRewardsConfig[req.user.ChapterID - 2] || {};
    (config.other_display || []).forEach((item, index) => {
        if (index < 5 && rewardHours > 0) {
            rewards.push([item[0], Math.floor(item[1] / 5) * rewardHours]);
        } 
        fastRewards.push(item);
    })

    res.json(formatResponse({
        kv: {
            DrawOfflineTime: user.DrawOfflineTime,
        },
        rewards,
        fastRewards,
        show_hour_exp: config.hour_exp,
        show_hour_gold: config.hour_gold,
        usePower: config.stamina
    }));
})

// 获取巡逻奖励
router.post('/battle/drawOfflineEarn', async (req, res) => {
    const user = req.user;
    
    // 获取奖励
    achieveTaskRecord(user, GameConfig.TaskType.GetOfflineReward);
    await user.save();

    res.json(formatResponse({
        
    }));
})
// 获取扫荡奖励
router.post('/battle/fastBattle', async (req, res) => {
    const user = req.user;
    let config = GameConfig.trainRewardsConfig[req.user.ChapterID - 2] || {};
    let rewards = config.other_display || [];
    if (req.body.ad) {
        // 看广告获取
        // 检查剩余次数
        if (user.TodayCounts.LeftVideoFastBattleCount <= 0) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"));
        }
        user.TodayCounts.LeftVideoFastBattleCount --;
    } else {
        // 检查剩余次数
        if (user.TodayCounts.LeftPowerFastBattleCount <= 0 ) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "FAIL_GET"));
        }
        // 消耗体力获取
        if (!saveUserItem(user, GameConfig.ItemId.Power, -config.stamina)) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
        }
        user.TodayCounts.LeftPowerFastBattleCount --;
    }
    // 获取奖励
    let returnList = saveUserItemList(user, rewards);
    achieveTaskRecord(user, GameConfig.TaskType.FastBattle);
    await user.save();

    res.json(formatResponse({
        kv: {
            LeftVideoFastBattleCount: user.TodayCounts.LeftVideoFastBattleCount,
            LeftPowerFastBattleCount: user.TodayCounts.LeftPowerFastBattleCount,
            Exp: user.Exp,
            Level: user.Level,
            Power: user.Power
        },
        ...returnList
    }));
})

module.exports = router;