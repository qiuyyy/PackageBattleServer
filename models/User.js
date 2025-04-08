const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { getSercetKey } = require('../tools/CustomUtils');

const neighborUserSchema = new mongoose.Schema({
  // Userid: { type: String, required: true, unique: true ,index: true}, // 用户ID
  openid: { type: String, required: true, unique: true }, // 用户唯一标识
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
  Regdate: { type: Number, default: Date.now }, // 注册时间
  ChapterID: { type: Number, default: 1 }, // 通关章节
  ChapterWaveId: { type: Number, default: 0 }, // 通关波次
  equips: { type: Array, default: [] }, // 已解锁的武器
  equip_table: { type: Array, default: [] }, // 已上阵的武器
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