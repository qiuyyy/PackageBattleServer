const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getRandomWeapon, saveUserItem, getRandomByProb, checkItemIsEnough } = require('../tools/CustomUtils');
var GameConfig = require("../tools/GameConfig");

//=======================每日商店=======================
// 获取每日商店数据
router.post('/shop/dailyStore', async (req, res) => {
    try {
        // 判断是否为今日首次登录
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // 获取今天零点的时间戳
        if (!user.last_login_time || user.last_login_time < todayStart) { // 今天首次登录
            // 重置每日商店
            user.api.dailyStore = [
                {Count: 10, Discount: 10, Id: 1, ItemId: 1, Left: 2, Price: 1, PriceType: 0, PriceType2: "2,1", Time: 0, priceType2List: [2, 1]},
                {Count: 50, Discount: 10, Id: 2, ItemId: 110, Left: 2, Price: 20, PriceType: 0, PriceType2: "1,1", Time: 0, priceType2List: [1, 1]},
                {Count: 100, Discount: 10, Id: 3, ItemId: 2, Left: 3, Price: 50, PriceType: 2, PriceType2: "0,0,0", Time: 0, priceType2List: [0, 0, 0]},
                // Count:物品数量 Discount:折扣  Id:商品id ItemId:物品id Left:剩余数量 Price:价格 PriceType:价格类型（2-免费 1-广告 0-消耗） PriceType2:价格类型2 Time:刷新时间 BuyNum:购买数量
            ]
            await user.save();
        }
        res.json(formatResponse(user.api.dailyStore));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
})


// 刷新每日商店
router.post('/shop/refreshDailyStore', async (req, res) => {
    const user = req.user;
    try {
        // 消耗
        if (req.body.cost) {
            if (!saveUserItem(user, req.body.cost[0], - req.body.cost[1])) { // 消耗
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
            }
        }

        user.TodayCounts.RereshStoreNum++; // 今日刷新商店次数+1
        // 刷新非免费商品剩余数量
        user.api.dailyStore = user.api.dailyStore.map(item => {
            if (item.PriceType !== 0) { // 非免费商品
                item.Left = item.priceType2List.length; // 重置剩余数量
            }
            return item;
        })
        await user.save();
        res.json(formatResponse({
            dailyStore: user.api.dailyStore,
            RereshStoreNum: user.TodayCounts.RereshStoreNum,
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});

// 购买每日商店
router.post('/shop/dailyStoreBuy', async (req, res) => {
    const user = req.user;
    try {
        let item = user.api.dailyStore.find(e => e.Id === req.body.Id); // 商品
        let costId = 0;
        // 扣除消耗
        if (item.priceType2List[item.priceType2List.length - item.Left] == 0) {
            // 消耗钻石
            costId = GameConfig.ItemId.Diamond;
            if (!saveUserItem(user, GameConfig.ItemId.Diamond, - item.Price)) {
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
            }
        } else if (item.priceType2List[item.priceType2List.length - item.Left] == 3) {
            // 消耗金币
            costId = GameConfig.ItemId.Gold;
            if (!saveUserItem(user, GameConfig.ItemId.Gold, - item.Price)) {
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, "ITEM_NOT_ENOUGH"));
            }
        }
        // 购买看广告商品后需要等待
        if (item.priceType2List[item.priceType2List.length - item.Left] == 1 
            && item.priceType2List[item.priceType2List.length - item.Left + 1]
            && item.priceType2List[item.priceType2List.length - item.Left + 1] == 1) {
            item.Time = Math.floor(new Date().getTime() / 1000); // 刷新购买时间;
        }
        // 扣除剩余
        item.Left--;
        // 获得物品
        let items = saveUserItem(user, item.ItemId, item.Count);
        await user.save();
        // 返回数据
        if (costId) { // 消耗物品
            items.push([costId, -item.Price]);
        }
        res.json(formatResponse({
            items,
            // original: [user.Diamond, user.Gold, user.Power]
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});



module.exports = router;