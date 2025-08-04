const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getRandomWeapon, saveUserItem, getRandomByProb, checkItemIsEnough, saveUserItemList, pushItemsToList, getConfigData, getRandomEquipExtraAttr,achieveTaskRecord, getRandomGem, addGemToUser } = require('../tools/CustomUtils');
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
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.INVALID_EQUIP));
        }
        // 检查材料是否充足
        if (!checkItemIsEnough(user, req.body.costItems)) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
        }
        // 扣除材料
        req.body.costItems.forEach(item => {
            saveUserItem(user, item[0], - item[1]);
        })
        // 装备升级
        equip.lv += 1;
        user.equips[index] = equip; // 保存
        achieveTaskRecord(user, GameConfig.TaskType.WeaponUpgrade);
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

// 武器升星
router.post('/equip/upStar', async (req, res) => {
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
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.INVALID_EQUIP));
        }
        // 检查材料是否充足
        let starUpConfig = getConfigData("EquipStar").find(c => c.EquipStar == equip.star);
        let cost = getConfigData("EquipBase").find(c => c.EquipID == req.body.cfgid).UpgradeStarItem.map(itemId => {
            if (itemId == 109) { // 升星石
                return [itemId, - starUpConfig.ItemCost];
            } else { // 图纸
                return [itemId, - starUpConfig.ChipCost];
            }
        });
        if (!checkItemIsEnough(user, cost)) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
        }
        // 扣除材料
        let result = saveUserItemList(user, cost);
        // 装备升星
        equip.star += 1;
        user.equips[index] = equip;
        await user.save();
        res.json(formatResponse({
            equip: equip, // 武器信息
            ...result,
            bag: user.api.bagInfo
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
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
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
    // 更新刷新时间
    user.cardlucky.refresh_time = new Date().getTime() + GameConfig.luckyRefreshTime;
    await user.save();
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
        // 没有配置或者已经过期，重新配置
        // 初始化数据
        user.cardlucky.lucky_rewards = []; // 重置奖品列表
        user.cardlucky.draw_reward_idx = []; // 重置已获得奖励
        user.cardlucky.rate = 0; // 重置倍率
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
        // 更新刷新时间
        user.cardlucky.refresh_time = new Date().getTime() + GameConfig.luckyRefreshTime;
    }
    await user.save();
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
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
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
    // 在剩余选项中抽取结果
    let idx = Math.floor(Math.random() * (user.cardlucky.lucky_rewards.length - user.cardlucky.draw_reward_idx.length)); // 随机奖品
    let reward = user.cardlucky.lucky_rewards.filter((e,index) => {
        return user.cardlucky.draw_reward_idx.indexOf(index) == -1; // 未抽过的奖品
    })[idx]; // 奖品
    // 保存已抽取的奖品
    user.cardlucky.draw_reward_idx.push(user.cardlucky.lucky_rewards.indexOf(reward));
    saveUserItem(user, reward[0], reward[1] * user.cardlucky.rate);
    // 如果为新武器则解锁
    let newEquips = [];
    if (reward[0] >= 1000 && !user.equips.find(e => e.cfgid === reward[0] - 1000)) {
        newEquips = [{cfgid: reward[0] - 1000, color_cfgid:0,lv: 1, star:0}];
        achieveTaskRecord(user, GameConfig.TaskType.GetWeapon);
        user.equips.push(newEquips[0]); // 解锁新武器 
    }
    achieveTaskRecord(user, GameConfig.TaskType.WeaponCall);
    await user.save();

    res.json(formatResponse({
        items: [
            [costCurrencyTypeMap[user.cardlucky.draw_reward_idx.length - 1], - costCurrencyCountMap[user.cardlucky.draw_reward_idx.length - 1] * user.cardlucky.rate],
            [reward[0], reward[1] * user.cardlucky.rate]
        ], // 物品增减
        equips: newEquips, // 新武器
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

// 装备替换
router.post('/role_equip/wear', async (req, res) => {
    const user = req.user;
    const equipId = req.body.id;
    const equip = user.RoleEquips.find(e => e.Id == equipId);
    if (!equip) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "装备不存在"));
    }
    user.Gear["Gear" + getEquipPartById(equip.Cfg)] = equipId;
    await user.save();
    res.json(formatResponse({
        Gear: user.Gear
    }));
});

// 装备升品
router.post('/role_equip/upQuality', async (req, res) => {
    const user = req.user;
    const id = req.body.id;
    let equip = user.RoleEquips.find(e => e.Id == id);
    let equipCfg = getConfigData("RoleEquip").find(e => e.Id == equip.Cfg);
    let cost = equipCfg.QualityUpCost;
    if (!equip) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "装备不存在"));
    }
    // 消耗
    if (!checkItemIsEnough(user, cost)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
    }
    cost = cost.map(e => [e[0], -e[1]]);
    let resultList = saveUserItemList(user, cost);
    // 升品
    equip.Qcost -= cost[0][1]
    equip.Cfg = getConfigData("RoleEquip").find(e => {
        if (e.Quality == equipCfg.Quality
            && e.Type == equipCfg.Type
            && ((e.ColorQuality == equipCfg.ColorQuality && e.NameQuality == equipCfg.NameQuality + 1) || (e.ColorQuality == equipCfg.ColorQuality + 1 && e.NameQuality == 1))
        ) {
            return e;
        }
    }).Id;
    await user.save();
    res.json(formatResponse({
        ...resultList,
        RoleEquip: equip
    }));
});

// 装备分解
router.post('/role_equip/decompose', async (req, res) => {
    const user = req.user;
    const ids = req.body.ids;
    let getItems = []; //分解后得到的物品

    ids.forEach(id => {
        let equip = user.RoleEquips.find(e => e.Id == id);
        getItems = pushItemsToList(getItems, [[133, Math.ceil(equip.Qcost * 0.7) + equip.DecomNum]])
    })
    // 获得
    let resultList = saveUserItemList(user, getItems);
    // 装备销毁
    user.RoleEquips = user.RoleEquips.filter(e => !ids.some(id => id == e.Id));
    await user.save();
    res.json(formatResponse({
        ...resultList,
    }));
});


// 部位强化
router.post('/gear/upgrade', async (req, res) => {
    const user = req.user;
    const part = req.body.part;
    // 消耗
    let config = GameConfig.roleEquipUpgradeConfig.find(e => e.Level == user.Gear[`Part${part}Lv`]);
    if (!config) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "无法升级"));
    }
    let cost = [[getEquipPrintIdByPart(part), config.PrintCount]].concat(config.Cost);
    if (!checkItemIsEnough(user, cost)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
    }
    cost = cost.map(e => [e[0], -e[1]]);
    let resultList = saveUserItemList(user, cost);
    // 升级
    user.Gear[`Part${part}Lv`] ++;
    await user.save();
    res.json(formatResponse({
        ...resultList,
        Gear: user.Gear
    }));
});

// 部位一键强化
router.post('/gear/batchUpgrade', async (req, res) => {
    // 按部位顺序 升到最大值 再继续下一部位
    const user = req.user;
    let resultList = [];
    for (let part = 1; part <= 6; part ++) {
        // 消耗
        while(true) {
            let config = GameConfig.roleEquipUpgradeConfig.find(e => e.Level == user.Gear[`Part${part}Lv`]);
            if (!config || config.PrintCount == 0) {
                // 无法升级
                break;
            }
            let cost = [[getEquipPrintIdByPart(part), config.PrintCount]].concat(config.Cost);
            if (!checkItemIsEnough(user, cost)){
                // 材料不足
                break;
            }
            cost = cost.map(e => [e[0], -e[1]]);
            resultList = pushItemsToList(resultList, cost);
            // 升级
            user.Gear[`Part${part}Lv`] ++;
        }
    }
    await user.save();
    res.json(formatResponse({
        ...resultList,
        Gear: user.Gear
    }));
});

// 装备洗练
router.post('/role_equip/refine', async (req, res) => {
    const user = req.user;
    const id = req.body.id;
    let equip = user.RoleEquips.find(e => e.Id == id);
    let cost = getConfigData("RoleEquip").find(e => e.Id == equip.Cfg).RefineCost;
    // 消耗
    if (!checkItemIsEnough(user, cost)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
    }
    cost = cost.map(e => [e[0], -e[1]]);
    let resultList = saveUserItemList(user, cost);
    // 存储锻造石消耗
    equip.Qcost -= cost[0][1];
    // 洗练
    let newAttr = getRandomEquipExtraAttr(equip.Cfg);
    equip.PreviewExtraAttrs = newAttr;
    await user.save();
    res.json(formatResponse({
        ...resultList,
        RoleEquip: equip
    }));
});

// 装备保存洗练属性
router.post('/role_equip/saveRefine', async (req, res) => {
    const user = req.user;
    const id = req.body.id;
    let equip = user.RoleEquips.find(e => e.Id == id);
    // 保存洗练属性
    equip.ExtraAttrs = equip.PreviewExtraAttrs;
    equip.PreviewExtraAttrs = [];
    await user.save();
    res.json(formatResponse({
        RoleEquip: equip
    }));
});

// 根据装备id获取装备部位
getEquipPartById = function(equipId) {
    let part = Number((equipId+'')[0]);
    return part;
};

// 根据装备部位获取图纸id
getEquipPrintIdByPart = function(part) {
    let id = 126 + part;
    return id;
};


// 宝石镶嵌
router.post("/gear/wearGem", async (req, res) => {
    const user = req.user;
    // 检查是否有该宝石
    let gemData = user.Gems.filter(i => i._id == req.body.gem);
    if (!gemData) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "未拥有该宝石"));
    }
    // 检查孔位是否已镶嵌
    let gemGear = user.GearGems[req.body.plan].find(e => e.Part == req.body.part && e.Hole == req.body.hole);
    if (gemGear && gemGear.gem) {
        if (gemGear.gem != gemData[0]._id) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "已无可镶嵌孔位"));
        }
    }
    // 存储镶嵌
    let gear = {
        Plan: req.body.plan,
        Part: req.body.part,
        Hole: req.body.hole,
        Gem: req.body.gem
    }
    user.GearGems[req.body.plan].push(gear);
    // 手动标记 GearGems 字段变更
    user.markModified('GearGems');
    await user.save();
    res.json(formatResponse({
        GearGem: gear
    }));
})

// 卸下宝石
router.post("/gear/unwearGem", async (req, res) => {
    const user = req.user;
    let gearGem = user.GearGems[req.body.plan].find(e => e.Part == req.body.part && e.Hole == req.body.hole);
    if (!gearGem) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "未镶嵌该宝石"));
    }
    // 保存
    let newGear = {
        Plan: req.body.plan,
        Part: req.body.part,
        Hole: req.body.hole,
        Gem: ""
    }
    user.GearGems[req.body.plan].find(e => {
        if (e.Part == req.body.part && e.Hole == req.body.hole) {
            e.Gem = "";
        }
    })
    // 手动标记 GearGems 字段变更
    user.markModified('GearGems');
    await user.save();
    res.json(formatResponse({
        GearGem: newGear
    }));
})

// 宝石锁定/解锁
router.post("/gear/lockGem", async (req, res) => {
    const user = req.user;
    let gem = user.Gems.find(e => e._id == req.body.id);
    if (!gem) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "未拥有该宝石"));
    }
    // 保存
    gem.Locked = gem.Locked ? 0 : 1;
    await user.save();
    res.json(formatResponse({
        Gem: gem
    }));
})

// 更换镶嵌方案
router.post("/gear/select", async (req, res) => {
    const user = req.user;
    let plan = req.body.plan;
    if (!user.GearGems[plan]) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "方案不存在"));
    }
    // 保存
    user.Gear.Plan = plan;
    await user.save();
    res.json(formatResponse({
        Plan: plan
    }));
})

// 宝石洗练
router.post("/gear/remakeGem", async (req, res) => {
    const user = req.user;
    let gem = user.Gems.find(e => e._id == req.body.id);
    if (!gem) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "未拥有该宝石"));
    }
    let gemConfig = getConfigData("Gem").find(e => e.Id == gem.Cfgid);
    // 消耗品
    let cost = gemConfig.RefreshItemId;
    if (!checkItemIsEnough(user, cost)){
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
    }
    // 消耗
    let resultList = saveUserItemList(user, cost);
    // 保存
    let newId = getRandomGem(gemConfig.GemQuality, gemConfig.Type, 1)[0];
    let newGem = {};
    user.Gems = user.Gems.map(g => {
        if (g._id == req.body.id) {
            g.Cfgid = newId;
            newGem = g;
        }
        return g;
    });

    await user.save();
    res.json(formatResponse({
        Gem: newGem,
        ...resultList
    }));
})

// 宝石一键合成
router.post("/gear/mergeGems", async (req, res) => {
    const user = req.user;
    // 获取可合成列表
    let costList = []; // 耗材列表 {部位_品质: {count: 个数, list: 宝石列表}}
    const combineCostCount = 5; // 合成消耗个数
    user.Gems.filter(g => {
        let gemConfig = getConfigData("Gem").find(e => e.Id == g.Cfgid);
        // 没有被锁
        if (g.Locked) return false;
        // 没有被镶嵌
        for(let i = 1; i <=3; i++) {
            if (user.GearGems[i].find(e => e.Gem == g._id)) {
                return false;
            }
        }
        // 有合成目标
        if (!getConfigData("Gem").find(e => e.Type == gemConfig.Type && e.GemQuality == gemConfig.GemQuality + 1)) return false;

        costList[gemConfig.Type + "_" + gemConfig.GemQuality] || (costList[gemConfig.Type + "_" + gemConfig.GemQuality] = {count: 0, list: []});
        costList[gemConfig.Type + "_" + gemConfig.GemQuality].count = (costList[gemConfig.Type + "_" + gemConfig.GemQuality].count || 0) + 1;
        costList[gemConfig.Type + "_" + gemConfig.GemQuality].list.push(g);
        return true;
    })
    let del = [];
    let add = [];
    // 总结:消耗 & 合成
    for (let key in costList) {
        let part = key.split("_")[0]; // 部位
        let quality = key.split("_")[1]; // 品质
        let combineCount = Math.floor(costList[key].count / combineCostCount); // 可合成几个
        if (combineCount > 0) {
            del = costList[key].list.slice(0, combineCostCount * combineCount);
            add = add.concat(getRandomGem(Number(quality) + 1, part, combineCount));
        } 
    }
    // 执行:消耗 & 合成
    user.Gems = user.Gems.filter(g => {
        return !del.find(e => e._id == g._id);
    })
    let result = {};
    if (add.length > 0) {
        result = addGemToUser(user, add);
    }

    await user.save();

    res.json(formatResponse({
        AddGems: result.gems,
        DelGems: del.map(i => i._id),
        ...result
    }));
})

module.exports = router;