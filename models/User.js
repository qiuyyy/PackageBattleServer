const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { getSercetKey } = require('../tools/CustomUtils');
const { totalLuckyNum } = require('../tools/GameConfig');

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
  priceType2List: { type: Array, required: true }, // 价格类型2数值
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
  fixedReward: { type: Array, default: [], required: true }, // 固定奖励I
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
})

const neighborUserSchema = new mongoose.Schema({
  // Userid: { type: String, required: true, unique: true ,index: true}, // 用户ID
  openid: { type: String, required: true, unique: true ,index: true}, // 用户唯一标识
  last_login_time: { type: Number, default: Date.now }, // 上次登录时间
  nickname: { type: String, default: '' }, // 用户昵称
  serverName: { type: String, default: '' }, // 服务器名称
  equip_table: { type: Array, default: [] }, // 装备列表
  Gold: { type: Number, default: 0 }, // 金币数量
  Diamond: { type: Number, default: 0 }, // 钻石数量
  Level: { type: Number, default: 1 }, // 用户等级
  Exp: { type: Number, default: 0 }, // 当前经验值
  MaxPower: { type: Number, default: 30 }, // 最大体力值
  Power: { type: Number, default: 30 }, // 当前体力值
  PowerRecoveryStartTime: { type: Number, default: 0 }, // 体力恢复开始时间
  Regdate: { type: Number, default: Date.now }, // 注册时间
  ChapterID: { type: Number, default: 1 }, // 通关章节
  ChapterWaveId: { type: Number, default: 0 }, // 通关波次
  equips: { type: Array, default: [] }, // 已解锁的武器
  equip_table: { type: Array, default: [] }, // 已上阵的武器
  api: {type: apiSchema, default: {}}, // 数据
  DrawChapterBoxAny: { type: String, default: "" }, // 已领取章节宝箱
  TalentLeft: { type: Number, default: 1000 }, // 左侧天赋解锁id
  TalentRight: { type: Number, default: 2000 }, // 右侧天赋解锁id
  function_open: { type: Array, default: [] }, // 已功能开放
  Gear: { type: Array, default: [] }, // TODO: 啥东西
  battleInfo: { type: battleInfoSchema, }, // 进行中战斗信息
  cardlucky: { type: cardluckySchema, default: {curLuckyNum: 0, totalLuckyNum: 5, luckyQuality: 3, lucky_rewards: [], draw_reward_idx: [], rate: 0, refresh_time: 0}}, // 武器祈愿
  magicWeapon: { type: Array, default: ["M2201"] }, // 已解锁神话武器
  TodayCounts: {type: TodayCountsSchema, default: {}}, // 今日次数
});

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