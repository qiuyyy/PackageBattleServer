// 任务相关
var GameConfig = require("../tools/GameConfig");
const express = require('express');
const router = express.Router();
const { formatResponse, saveUserItem, getRandomByProb,getConfigData, saveUserItemList, checkIsToday} = require('../tools/CustomUtils');
// 任务列表
router.post('/task/getTaskList', async (req, res) => {
    const user = req.user;
    try {
        res.json(formatResponse({
            ...user.DailyTask._doc,
            ...user.WeeklyTask._doc,
            ...user.Achievement._doc
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取每日任务
router.post('/task/drawDailyTask', async (req, res) => {
    const user = req.user;
    user.DailyTask.daily.forEach(task => {
        if (task.task_id == req.body.id) {
            task.draw = true;
        }
    });
    await user.save();
    try {
        res.json(formatResponse({}));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取每日活跃度宝箱
router.post('/task/drawDailyActive', async (req, res) => {
    const user = req.user;
    // 验证活跃度
    let daily = user.DailyTask.daily || [];
    let totalActivation = 0; // 总获得的活跃度
    daily.forEach(task => {
        if (task.draw) {
            let data = getConfigData("RoutineTask").filter(data => task.task_id == data.Id);
            totalActivation += data.DailyActiveReward;
        }
    })
    let data = getConfigData("RoutineActive").find(item => item.ID == req.body.id); // 活跃宝箱数据
    if (!data || totalActivation < data.Requirements) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    // 存储领取状态
    user.DailyTask.TaskDailyActiveDraw += user.DailyTask.TaskDailyActiveDraw=="" ? `${req.body.id}` : `,${req.body.id}`;
    // 获取奖励
    let resultList = saveUserItemList(user, data.Reward);
    await user.save();
    try {
        res.json(formatResponse({
            ...resultList,
            kv: {
                TaskDailyActiveDraw: user.DailyTask.TaskDailyActiveDraw
            }
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取周常任务
router.post('/task/drawWeeklyTask', async (req, res) => {
    const user = req.user;
    user.WeeklyTask.weekly.forEach(task => {
        if (task.task_id == req.body.id) {
            task.draw = true;
        }
    });
    await user.save();
    try {
        res.json(formatResponse({}));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取周常活跃度宝箱
router.post('/task/drawWeeklyActive', async (req, res) => {
    const user = req.user;
    // 验证活跃度
    let weekly = user.WeeklyTask.weekly || [];
    let totalActivation = 0; // 总获得的活跃度
    weekly.forEach(task => {
        if (task.draw) totalActivation += task.num;
    })
    let data = getConfigData("WeeklyActive").find(item => item.ID == req.body.id); // 活跃宝箱数据
    if (!data || totalActivation >= data.Requirements) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    // 存储领取状态
    user.WeeklyTask.TaskWeeklyActiveDraw += user.WeeklyTask.TaskWeeklyActiveDraw=="" ? `${req.body.id}` : `,${req.body.id}`;
    // 获取奖励
    let resultList = saveUserItemList(user, data.FixReward);
    await user.save();
    try {
        res.json(formatResponse({
            ...resultList,
            kv: {
                TaskWeeklyActiveDraw: user.DailyTask.TaskWeeklyActiveDraw
            }
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取成就奖励
router.post('/task/drawAchievementTask', async (req, res) => {
    const user = req.user;
    try {
        // 验证次数
        let taskData = getConfigData("AchievementTask").find(task => task.ID == req.body.id);
        let achiveCount = user.Achievement.userInfo[taskData.AchievementsType];
        if (achiveCount < taskData.AchievementsNeed || user.Achievement.achievement.indexOf(req.body.id) == -1) {
            // 次数不足 || 没有该任务
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
        }
        // 记录领取状态
        let oldTaskId = taskData.ID;
        let newTaskId = taskData.Child;
        user.Achievement.achievement[user.Achievement.achievement.indexOf(oldTaskId)] = newTaskId;
        // 领取奖励
        let resultData = saveUserItemList(user, taskData.Reward);

        await user.save();
        res.json(formatResponse({
            ...resultData,
            removeid: oldTaskId,
            newid: newTaskId,
            servertime: Math.floor(new Date().getTime() / 1000),
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 获取每日签到数据
router.post('/user/signInfo', async (req, res) => {
    const user = req.user;
    
    // await user.save();
    try {
        res.json(formatResponse({
            ...user.Sign._doc,
            servertime: Math.floor(new Date().getTime() / 1000),
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取每日签到奖励
router.post('/user/sign', async (req, res) => {
    const user = req.user;
    // 检查是否可领取
    if (checkIsToday(user.Sign.SignTime)) {
        // 今日已领取宝箱
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    // 保存领取数据
    user.Sign.SignDay ++;
    if (user.Sign.SignDay > 7) user.Sign.SignDay = 0; // 7天一循环
    user.Sign.SignAccumulate ++;
    if (user.Sign.SignAccumulate > 60) user.Sign.SignAccumulate = 1; // 60天一循环
    user.Sign.SignTime = Math.floor(new Date().getTime() / 1000); // 记录签到时间
    // 领取奖励 (只循环1-7)
    // let maxWeek = getConfigData("LoginSevenDay")[getConfigData("LoginSevenDay").length-1].week; // 配置最大周数
    // let week = Math.floor(user.Sign.SignAccumulate / 7) % maxWeek == 0 ? maxWeek : Math.floor(user.Sign.SignAccumulate / 7) % maxWeek; // 第几周 没有则循环
    let data = getConfigData("LoginSevenDay").find(item => item.Id == user.Sign.SignDay);
    let resultData = saveUserItemList(user, data.rewards);

    await user.save();
    try {
        res.json(formatResponse({
            ...resultData,
            kv: {
                SignDay: user.Sign.SignDay,
                SignTime: user.Sign.SignTime
            },
            servertime: Math.floor(new Date().getTime() / 1000),
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 领取累计签到奖励
router.post('/user/signAccumulate', async (req, res) => {
    const user = req.user;
    // 检查是否可领取
    let drawList = user.Sign.SignAccumulateDrawFlag.split(",");
    if (user.Sign.SignAccumulate < req.body.realday || drawList.indexOf(req.body.realday+"") != -1) {
        // 不可领取 || 已领取
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    // 保存领取数据
    let data = getConfigData("LoginAccumulate").find(item => item.day == req.body.realday);
    user.Sign.SignAccumulateDrawFlag += user.Sign.SignAccumulateDrawFlag == "" ? `${data.Id}` : `,${data.Id}`;
    
    // 领取奖励
    let resultData = saveUserItemList(user, data.reward);

    await user.save();
    try {
        res.json(formatResponse({
            ...resultData,
            kv: {
                SignAccumulateDrawFlag: user.Sign.SignAccumulateDrawFlag,
            },
            servertime: Math.floor(new Date().getTime() / 1000),
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 七日签到奖励领取
router.post("/user/drawSigninNewUser", async (req, res) => {
    const user = req.user;
    if (user.SigninNewUserDrawIds.indexOf(req.body.id) != -1) {
        // 已领取
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    // 领取奖励
    let config = getConfigData("LoginNewUser").find(item => item.Id == req.body.id);
    let resultData = saveUserItemList(user, config.Rewards);
    // 记录领取状态
    user.SigninNewUserDrawIds += user.SigninNewUserDrawIds == "" ? `${req.body.id}` : `,${req.body.id}`;
    user.SigninNewUserDrawTime = Math.floor(new Date().getTime() / 1000);
    await user.save();
    res.json(formatResponse({
        ...resultData,
    }));
})
// 七日挑战信息
router.post("/sevenday/info1", async (req, res) => {
    const user = req.user;
    
    res.json(formatResponse({
        tastList: user.SevendayTask_taskList,
        active: user.SevendayTask_active,
    }));
})
// 七日挑战领取奖励
router.post("/sevenday/drawTask", async (req, res) => {
    const user = req.user;
    let config = getConfigData("InitialChallengeTask").find(item => item.ID == req.body.id); // 任务配置
    let task = user.SevendayTask_taskList.find(t => t.TaskId == req.body.id); // 任务数据
    if (!task) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    task.Draw = 1;
    user.SevendayTask_active += config.Active;
    let resultData = saveUserItemList(user, config.Reward);

    await user.save();
    
    res.json(formatResponse({
        ...resultData,
        active: user.SevendayTask_active,
    }));
})
// 七日挑战领取活力值宝箱
router.post("/sevenday/drawActive", async (req, res) => {
    const user = req.user;
    let config = getConfigData("InitialChallengeActiveReward").find(item => item.ID == req.body.id && item.Type == req.body.type); // 宝箱配置
    if (config.NeedActive > user.SevendayTask_active) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    user.SevendayTaskDrawIds += user.SevendayTaskDrawIds == "" ? `${req.body.id}` : `,${req.body.id}`;
    let resultData = saveUserItemList(user, config.Reward);
    await user.save();
    
    res.json(formatResponse({
        ...resultData,
    }));
})

module.exports = router;