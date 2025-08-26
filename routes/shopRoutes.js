const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getConfigData, saveUserItem, getRandomByProb, checkItemIsEnough, pushItemsToList,achieveTaskRecord, saveUserItemList } = require('../tools/CustomUtils');
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
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
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
        // 检查消耗
        if (item.priceType2List[item.priceType2List.length - item.Left] == 0) {
            // 消耗钻石
            costId = GameConfig.ItemId.Diamond;
            if (!checkItemIsEnough(user, [[GameConfig.ItemId.Diamond, - item.Price]])) {
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
            }
        } else if (item.priceType2List[item.priceType2List.length - item.Left] == 3) {
            // 消耗金币
            costId = GameConfig.ItemId.Gold;
            if (!checkItemIsEnough(user, [[GameConfig.ItemId.Gold, - item.Price]])) {
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
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
        // 获得并扣除物品
        let items = [[item.ItemId, item.Count], [costId, -item.Price]];
        let obj = saveUserItemList(user, items);
        achieveTaskRecord(user, GameConfig.TaskType.DailyShopBuy);
        await user.save();
        res.json(formatResponse({
            ...obj
        }));
    } catch (err) {
        res.status(500).json({ errcode: 1, message: 'Server error' + err });
    }
});


// 开宝商店宝箱
router.post("/gear/draw", async (req, res) => {
    const user = req.user;
    let boxId = req.body.id;
    let boxConfig = getConfigData("ShopBox").find(e => e.ID == boxId);
    let userBox = user.ShopBox.find(e => e.Id == boxId);
    let itemId = 0; // 消耗品id
    let itemCount = 0; // 消耗品数量
    let rewardCount = 1; //奖励数量/开宝箱数量
    if (!userBox) {
        return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.FAIL_GET));
    }
    if (req.body.isAd) {
        // 判断免费次数
        if (userBox.RemainFreeCount <= 0) {
            return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.COUNT_NOT_ENOUGH));
        }
        userBox.RemainFreeCount --;
    } else {
        // 判断消耗
        if (req.body.multi) {
            // 10次
            itemId = boxConfig.Key;
            if (!checkItemIsEnough(user, [[itemId, -10]])) {
                // 钥匙不足 使用货币
                itemId = boxConfig.CurrencyID;
                itemCount = boxConfig.Consume2;
            } else {
                itemId = boxConfig.Key;
                itemCount = 10;

            }
            if (!checkItemIsEnough(user, [[itemId, -itemCount]])) {
                // 货币不足
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
            }
            rewardCount = 10;
        } else {
            // 1次
            itemId = boxConfig.Key;
            if (!checkItemIsEnough(user, [[itemId, -1]])) {
                // 钥匙不足 使用货币
                itemId = boxConfig.CurrencyID;
                itemCount = boxConfig.Consume1;
            } else {
                itemId = boxConfig.Key;
                itemCount = 1;

            }
            if (!checkItemIsEnough(user, [[itemId, -itemCount]])) {
                // 货币不足
                return res.json(formatResponse({}, GameConfig.NetCode.FAIL, GameConfig.NetFailMsgCode.ITEM_NOT_ENOUGH));
            }
        }

    }
    // 消耗
    let costItem = [[itemId, -itemCount]];
    // 获得
    let rewardList = []; //奖池列表
    let rewardItem = []; // 奖励列表
    if (boxConfig.Type == 2) {
        // 材料宝箱 物品id,概率,数量 配置在config中
        rewardList = GameConfig.shopBox_3_reward;
        let rewardListObj = {};
        rewardList.forEach((r, i) => {
            rewardListObj[i] = r.prob;
        })
        for (let index = 0; index < rewardCount; index++) {
            let rIndex = getRandomByProb(rewardListObj)
            rewardItem.push([rewardList[rIndex].itemId, rewardList[rIndex].count]);
        }
    } else {
        for (let index = 0; index < rewardCount; index++) {
            // 是否必得
            if (userBox.FloorsNum == 1) {
                rewardList = boxConfig.FloorsDropId_extraReward;
                userBox.FloorsNum = boxConfig.FloorsLimit;
            } else {
                rewardList = boxConfig.Reward;
                userBox.FloorsNum--;
            }
            let rewardListObj = {};
            rewardList.forEach(e => {
                rewardListObj[e[0]] = e[1];
            })
            rewardItem.push([getRandomByProb(rewardListObj), 1]);
        }
    }
    
    // 组合消耗和获得 并 保存
    let items = costItem.concat(rewardItem);
    let obj = saveUserItemList(user, items, true);
    await user.save();
    res.json(formatResponse({
        ...obj,
        ShopBox: user.ShopBox,
    }));
});



module.exports = router;