const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { getSercetKey } = require('../tools/CustomUtils');
const bcrypt = require('bcrypt');

// 背包物品
const bagInfoSchema = new mongoose.Schema({
  Itemid: { type: Number, required: true }, // 物品ID
  Num: { type: Number, required: true }, // 物品数量 
})

// 每日商品
const dailyStoreSchema = new mongoose.Schema({
  Id: { type: Number, required: true }, // 商品ID
  Count: { type: Number, required: true }, // 物品数量
  Discount: { type: Number, required: true }, // 折扣
  ItemId: { type: Number, required: true }, // 物品ID
  Left: { type: Number, required: true }, // 剩余
  Price: { type: Number, required: true }, // 价格
  PriceType: { type: Number, required: true }, // 价格类型
  PriceType2: { type: String, required: true }, // 价格类型2（2-免费 1-广告 0-钻石 3-金币）
  Time: { type: Number, required: true }, // 上一次广告购买时间
  priceType2List: { type: Array, required: true }, // 价格类型2数值 index-购买次数 element-货币类型
})

// 精英关卡信息
const missionChallengeInfoSchema = new mongoose.Schema({
  task_id: { type: Number, required: true }, // 关卡ID
  draw: { type: Number, required: true }, // 已领取 0-未领取 1-已领取
  num: { type: Number, required: true }, // 可领取数量
})

const apiSchema = new mongoose.Schema({
  dailyStore: { type: [dailyStoreSchema], default: [] }, // 每日商品 
  bagInfo: { type: [bagInfoSchema], default: [] }, // 背包
  missionChallengeInfo: { type: [missionChallengeInfoSchema], default: [] }, // 精英关卡信息
})

// 进行中战斗信息 结束返回奖励
const battleInfoSchema = new mongoose.Schema({
  battleid: { type: Number, required: true }, // 战斗ID
  battle_type: { type: Number, required: true }, // 战斗类型 1-普通 3-精英
  configId: { type: Number, default: 1, required: true }, // 关卡
  reward: { type: Array, default: [], required: true }, // 奖励
  fixedReward: { type: Array, default: [], required: true }, // 固定奖励
  waveReward: { type: Array, default: [], required: true }, // 波次奖励
})

// 武器祈愿
const cardluckySchema = new mongoose.Schema({
  // 说明：当当前幸运值达到目标幸运值时，品质+1， 当前幸运值归0，目标幸运值+5
  curLuckyNum: { type: Number, required: true, default: 0}, // 当前幸运值
  totalLuckyNum: {type: Number, required: true, default: 5}, //目标幸运值
  luckyQuality: {type: Number, required: true, default: 3}, // 当前品质
  lucky_rewards: { type: Array, default: [] }, //祈愿奖品列表
  draw_reward_idx: { type: Array, required: true, default: [] }, //已获得奖励
  rate: { type: Number, required: true, default: 0 }, // 选择的倍率
  refresh_time: { type: Number, required: true, default: 0 }, // 剩余刷新时间
})

// 今日次数
const TodayCountsSchema = new mongoose.Schema({
  RereshStoreNum: { type: Number, required: true, default: 0 }, // 今日刷新商店次数
  BuyPowerVideoCount: { type: Number, required: true, default: 0 }, // 今日广告获取体力次数
  BuyPowerGemCount: { type: Number, required: true, default: 0 }, // 今日钻石购买体力次数
  LeftPowerFastBattleCount: { type: Number, required: true, default: 3 }, // 今日使用体力进行扫荡次数
  LeftVideoFastBattleCount: { type: Number, required: true, default: 1 }, // 今日看广告进行扫荡次数
})

// 签到信息
const SignSchema = new mongoose.Schema({
  SignDay: { type: Number, default: 0 }, //已签到天数 七天一循环
  SignAccumulate: { type: Number, default: 0 }, // 签到累计天数
  SignAccumulateDrawFlag: { type: String, default: "" }, // 签到累计天数宝箱领取
  SignTime: { type: Number, default: 0 }, // 上次签到的时间
})

const TaskSchema = new mongoose.Schema({
  draw: { type: Boolean, default: false }, // 是否已领取
  num: { type: Number, default: 0 }, // 达成次数
  task_id: { type: Number, default: 0 }, // 任务ID(对应RoutineTask表)
})

// 每日任务
const DailyTaskSchema = new mongoose.Schema({
  daily: { type: [TaskSchema], default: []}, // 任务数据
  dailyRefreshTime: { type: Number, default: 0 }, // 刷新时间
  TaskDailyActiveDraw: { type: String, default: "" }, // 活跃度宝箱领取
})

// 每周任务
const WeeklyTaskSchema = new mongoose.Schema({
  weekly: { type: [TaskSchema], default: []}, // 任务数据
  weeklyRefreshTime: { type: Number, default: 0 }, // 刷新时间
  TaskWeeklyActiveDraw: { type: String, default: "" }, // 活跃度宝箱领取
})

// 成就任务
const AchievementSchema = new mongoose.Schema({
  achievement: { type: [], default: []}, // 要展示的成就任务id列表
  userInfo: { type: {}, default: {}}, // 达成次数 {AchievementsType: count}
})

// 玩家装备
const RoleEquipSchema = new mongoose.Schema({
  Id: { 
    type: mongoose.Schema.Types.ObjectId, 
    unique: true, 
    required: true,
    default: function() {
      return new mongoose.Types.ObjectId(); // 使用 new 关键字生成 ObjectId
    }
  }, // 装备唯一 ID
  Cfg: { type: Number, default: 0 }, // 配置 ID
  DecomNum: { type: Number, default: 0 }, // 可分解数量
  PreviewExtraAttrs: { type: Array, default: []},
  ExtraAttrs: { type: Array, default: []},
  Qcost: { type: Number, default: 0 }, // 升品消耗的材料
}, { _id: false }); // 禁用自动生成 _id 字段

// 装备穿戴信息
const GearSchema = new mongoose.Schema({
  Gear1:{ type: String, default: "" }, //部位1穿戴装备id
  Gear2:{ type: String, default: "" },
  Gear3:{ type: String, default: "" },
  Gear4:{ type: String, default: "" },
  Gear5:{ type: String, default: "" },
  Gear6:{ type: String, default: "" },
  Part1Lv: { type: Number, default: 0 }, //部位1装备等级
  Part2Lv: { type: Number, default: 0 },
  Part3Lv: { type: Number, default: 0 },
  Part4Lv: { type: Number, default: 0 },
  Part5Lv: { type: Number, default: 0 },
  Part6Lv: { type: Number, default: 0 },
  Plan: { type: Number, default: 1 }, //使用的镶嵌方案
})

// 宝石
const GemSchema = new mongoose.Schema({
  Cfgid: { type: Number, default: 0 }, // 宝石id
  Locked: { type: Number, default: 0 }, //是否被锁定 0-否 1-是
})
// 宝石镶嵌
const GearGemSchema = new mongoose.Schema({
  Plan: { type: Number, default: 0 }, // 方案id 1-3
  Part: {type: Number, default: 0 }, // 部位 1-6
  Hole: {type: Number, default: 0 }, // 孔位 1-5
  Gem: { type: String, default: "" }, // 宝石_id
})

const neighborUserSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true ,index: true}, // 用户唯一标识
  last_login_time: { type: Number, default: Date.now }, // 上次登录时间
  nickname: { type: String, default: '' }, // 用户昵称
  password: { type: String, default: '' }, // 密码
  serverName: { type: String, default: '' }, // 服务器名称
  Gold: { type: Number, default: 0 }, // 金币数量
  Diamond: { type: Number, default: 0 }, // 钻石数量
  Level: { type: Number, default: 1 }, // 用户等级
  Exp: { type: Number, default: 0 }, // 当前经验值
  MaxPower: { type: Number, default: 30 }, // 最大体力值
  Power: { type: Number, default: 30 }, // 当前体力值
  PowerRecoveryStartTime: { type: Number, default: 0 }, // 体力恢复开始时间
  Regdate: { type: Number, default: Date.now }, // 注册时间
  ChapterID: { type: Number, default: 1 }, // 待通关章节
  ChapterWaveId: { type: Number, default: 0 }, // 通关波次
  equips: { type: Array, default: [] }, // 已解锁的武器
  equip_table: { type: Array, default: [] }, // 已上阵的武器
  api: {type: apiSchema, default: {dailyStore:[], bagInfo:[], missionChallengeInfo:[]}}, // 数据
  DrawChapterBoxAny: { type: String, default: "" }, // 已领取章节宝箱
  TalentLeft: { type: Number, default: 1000 }, // 左侧天赋解锁id
  TalentRight: { type: Number, default: 2000 }, // 右侧天赋解锁id
  function_open: { type: Array, default: [] }, // 已功能开放
  Gear: { type: GearSchema, default:{} }, // 装备信息
  battleInfo: { type: battleInfoSchema, }, // 进行中战斗信息
  cardlucky: { type: cardluckySchema, default: {curLuckyNum: 0, totalLuckyNum: 5, luckyQuality: 3, lucky_rewards: [], draw_reward_idx: [], rate: 0, refresh_time: 0}}, // 武器祈愿
  magicWeapon: { type: Array, default: [] }, // 已解锁神话武器
  TodayCounts: {type: TodayCountsSchema, default: {}}, // 今日次数
  toutiaoSideBarOnce: { type: Number, default: 0 }, // 抖音侧边栏是否已领取 0-未领取 1-已领取
  DrawOfflineTime: { type: Number, default: 0 }, // 离线奖励开始时间点（s）
  RoleEquips: {type: [RoleEquipSchema], default: []}, // 武器
  Sign: {type: SignSchema, default: {SignDay: 0, SignTime: 0, SignAccumulate: 0, SignAccumulateDrawFlag: ""}}, // 签到信息
  DailyTask: {type: DailyTaskSchema, default: {}}, // 日常任务
  WeeklyTask: {type: WeeklyTaskSchema, default: {}}, // 周常任务
  Achievement: {type: AchievementSchema, default: {}}, // 成就
  Gems: {type: [GemSchema], default: []}, //拥有的宝石
  GearGems: {type: Object, default: {1:[], 2:[], 3:[]}, of: [GearGemSchema]}, //宝石镶嵌 三个方案
  safeQuestion: {type: Object, default: {id: 0, answer: ""}}, // 密保问题
});

// 保存前加密密码
neighborUserSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

// 验证密码
neighborUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 根据token获取用户信息
neighborUserSchema.statics.getUserByToken = async function(token) {
  try {
    const sk = getSercetKey();
    const decoded = jwt.verify(token, sk);
    return await this.findOne({ openid: decoded.openid });
  } catch (err) {
    throw new Error('Invalid token');
  }
};

module.exports = mongoose.model('User', neighborUserSchema);