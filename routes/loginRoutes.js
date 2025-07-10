const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey, addEquipToUser, getConfigData, achieveTaskRecord} = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库
const axios = require('axios');
const GameConfig = require('../tools/GameConfig');

async function handleUserLogin(openid, res) {
  if (!openid) {
    return res.status(500).json({ error: 'Failed to get openid' });
  }

  var new_player = false;
  var user = await User.findOne({ openid: openid });
  var previousLoginTime = null; // 上次登录时间
  console.log("login find user:", user);
  if(!user){
    // 新玩家
    new_player = true;
    user = new User({ 
      nickname: "玩家" + openid.slice(-6), // 根据openid后六位生成一个昵称,
      openid: openid,
      last_login_time: new Date().getTime(), // 更新登录时间,
      Regdate: new Date().getTime(), // 添加注册时间
    });
    initNewPlayerData(user);
  } else {
    previousLoginTime = user.last_login_time; // 保存上次登录时间
    user.last_login_time = new Date().getTime(); // 更新为本次登录时间
    // 计算体力恢复
    if (user.Power < user.MaxPower && user.PowerRecoveryStartTime > 0) { // 未满体力
      const currentTime = Math.floor(new Date().getTime() / 1000); // 当前时间戳
      const recoveryPowerCount = Math.floor((currentTime - user.PowerRecoveryStartTime) / GameConfig.POWER_RECOVERY_CD); // 恢复次数
      if (recoveryPowerCount > 0) { // 恢复次数大于0
        user.Power = Math.min(user.Power + recoveryPowerCount, user.MaxPower); // 恢复体力
        user.PowerRecoveryStartTime = user.PowerRecoveryStartTime + recoveryPowerCount * GameConfig.POWER_RECOVERY_CD; // 更新恢复时间
      }
    }
    if (user.Power >= user.MaxPower) { // 满体力
      user.PowerRecoveryStartTime = 0; // 重置恢复时间
    }
  }

  const now = new Date();
  // 判断今日是否为周一
  if (now.getDay() === 1 || new_player) { // 周一 || 新玩家
    updateWeeklyData(user);
  }
  // 判断是否为今日首次登录
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // 获取今天零点的时间戳
  if (!previousLoginTime || previousLoginTime < todayStart) { // 今天首次登录
    updateDailyData(user);
    achieveTaskRecord(user, GameConfig.TaskType.DailyLogin);
  }
  await user.save();
  
  // 生成token
  const token = jwt.sign(
    { openid: user.openid }, 
    getSercetKey(),
    { expiresIn: '3h' } // token有效期1小时
  );

  // 返回数据给客户端
  res.json(formatResponse({
    openid,
    new_player,
    last_login_time: previousLoginTime,
    token,
  }));
}

// 初始化新用户的数据
function initNewPlayerData(user) {
  // 初始解锁武器
  user.equips = [
      { cfgid: 2101,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2102,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2103,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2104,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2201,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2202,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2203,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2205,color_cfgid:0,lv: 1, star:0},
      { cfgid: 2207,color_cfgid:0,lv: 1, star:0},
    ];
  // 初始上阵武器
  user.equip_table = [
      {equip_id: 2101, unlock: 1},
      {equip_id: 2102, unlock: 1},
      {equip_id: 2103, unlock: 1},
      {equip_id: 2104, unlock: 1},
      // {equip_id: 2201, unlock: 1},
      {equip_id: 2202, unlock: 1},
    ];
  // 初始解锁神话武器
  user.magicWeapon = ["M2201"]; 
  // 初始穿戴装备
  addEquipToUser(user, [101011, 201011, 301011, 401011, 501011, 601011]);
  user.Gear = {
    Gear1: "",
    Gear2: "",
    Gear3: "",
    Gear4: "",
    Gear5: "",
    Gear6: "",
    Part1Lv: 0,
    Part2Lv: 0,
    Part3Lv: 0,
    Part4Lv: 0,
    Part5Lv: 0,
    Part6Lv: 0,
    Plan: 1
  }
  user.RoleEquips.forEach((equip, index) => {
    user.Gear['Gear' + (index + 1)] = equip.Id;
  })
  // 成就
  // 每种类型取第一个
  let achievement = [];
  let typeList = [];
  let userInfo = {};
  getConfigData("AchievementTask").map(task => {
    if (typeList.indexOf(task.AchievementsType) == -1) {
      typeList.push(task.AchievementsType);
      achievement.push(task.ID);
      userInfo[task.AchievementsType] = 0;
    }
    return task;
  })
  user.Achievement = {
    achievement,
    userInfo
  }
  // 巡逻
  user.DrawOfflineTime = Math.floor(new Date().getTime() / 1000);
  return user;
}

// 更新每日刷新的数据
function updateDailyData(user) {
  // 重置每日商店
  user.api.dailyStore = [
    {Count: 10, Discount: 10, Id: 1, ItemId: 1, Left: 2, Price: 1, PriceType: 0, PriceType2: "2,1", Time: 0, priceType2List: [2, 1]},
    {Count: 50, Discount: 10, Id: 2, ItemId: 110, Left: 2, Price: 20, PriceType: 0, PriceType2: "1,1", Time: 0, priceType2List: [1, 1]},
    {Count: 100, Discount: 10, Id: 3, ItemId: 2, Left: 3, Price: 50, PriceType: 2, PriceType2: "0,0,0", Time: 0, priceType2List: [0, 0, 0]},
  ]
  // 重置每日次数
  user.TodayCounts = { 
    RereshStoreNum: 0,
    BuyPowerVideoCount: 0,
    BuyPowerGemCount: 0,
    LeftPowerFastBattleCount: GameConfig.faseBattleDailyPowerCount,
    LeftVideoFastBattleCount: GameConfig.fastBattleDailyVideoCount,
  };
  
  // 日常任务
  let daily  = [];
  getConfigData("RoutineTask").forEach(task => {
    daily.push({
      draw: false,
      num: 0,
      task_id: task.Id
    })
  })
  user.DailyTask = {
    daily: daily,
    dailyRefreshTime: Math.floor(new Date().setHours(0, 0, 0, 0) / 1000 + 24 * 3600), // 转天零点
    TaskDailyActiveDraw : ""
  }
  
  return user;
}

// 更新每周数据
function updateWeeklyData(user) {
  // 周常任务
  let weekly  = [];
  getConfigData("WeeklyTask").forEach(task => {
    weekly.push({
      draw: false,
      num: 0,
      task_id: task.ID
    })
  })
  // 获取当前日期
  const now = new Date();
  // 计算下周一的日期
  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (1 + 7 - now.getDay()) % 7);
  // 设置时间为零点
  nextMonday.setHours(0, 0, 0, 0);
  // 获取下周一零点的时间戳（秒）
  const nextMondayTimestamp = Math.floor(nextMonday.getTime() / 1000);
  user.WeeklyTask = {
    weekly: weekly,
    weeklyRefreshTime: nextMondayTimestamp, // 下周一零点
    TaskWeeklyActiveDraw : ""
  }
  return user;
}

router.post('/user/login', async (req, res) => {
    const openid = req.body.uuid;
    await handleUserLogin(openid, res);
});

// 接入抖音登录-获取token
router.post('/sdk/getWdToken', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: '缺少 code 参数' });
  }

  const appId = 'tt8951ffec16599cc302'; // 替换为你的抖音应用 AppID
  const appSecret = '46a49427d7d8b6e6edc714a8b36a6f2e30240be0'; // 替换为你的抖音应用 AppSecret
  const url = `https://developer.toutiao.com/api/apps/jscode2session?appid=${appId}&secret=${appSecret}&code=${code}`;

  try {
    const response = await axios.get(url);
    const { openid, session_key, errcode, errmsg } = response.data;
    if (errcode) {
      return res.status(500).json({ error: `抖音接口调用失败: ${errmsg}` });
    }
    await handleUserLogin(openid, res);
  } catch (error) {
    console.error('请求抖音接口失败', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 公告？
router.post('/system/notice', async (req, res) => {
  const user = req.user.toObject();
  res.json(formatResponse({}));
});
module.exports = router;