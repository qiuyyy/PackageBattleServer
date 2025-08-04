module.exports = {
    /**=========================通讯相关 */ 
    NetCode : {
        FAIL: -1,
        OK: 0,
        LoginDisabled: 1001,
        OtherLogin: 1002,
        VersionLow: 1003,
        RepeatedSettlement: 1004,
        StopServer: 1005,
        LoginAccountAgain: 1006, // 需要输入账号密码登录
        NoGmoney: -999,
        EquipTableEnough: -2
    },

    NetFailMsgCode: {
        ITEM_NOT_ENOUGH: "ITEM_NOT_ENOUGH", // 物品数量不足
        BATTLE_ID_NOT_MATCH: "BATTLE_ID_NOT_MATCH", // 战斗id不匹配
        FAIL_GET: "FAIL_GET", // 获取失败
        INVALID_EQUIP: "INVALID_EQUIP", // 装备不存在
        FAIL: "FAIL", // 失败
        CODE_IS_ERROR: "CODE_IS_ERROR", // 验证码错误
        COUNT_NOT_ENOUGH: "COUNT_NOT_ENOUGH", // 次数不足

    },

    /**=========================物品相关 */ 
    ItemId: {
        Diamond: 1, // 钻石
        Gold: 2, // 金币
        DNA: 3, // 特殊天赋书
        Power: 4, // 体力
        Exp: 5, // 经验
        DNA_SMALL: 6, // 普通天赋书
        ARENA_COIN: 9,
        FLOWER_ENERGY: 10,
        Energy: 6000,
        WeaponBlueprintRandom: 110, //随机武器图纸
        EquipBlueprintRandom: 137, //随机装备图纸
        WeaponRefresh: 122, //武器刷新券
        SkillRefresh: 123, //技能刷新券
    },
    
    /**=========================体力相关 */ 
    adGetPowerCount: 5, //广告获取数量
    gemGetPowerCount: 15, //购买获取数量
    gemGetPowerCost: 30, // 钻石购买体力消耗
    battlePowerCost: 5, //战斗体力消耗
    POWER_RECOVERY_CD: 1200, // 恢复1体力cd（同前端一致）

    /**=========================武器相关 */
    WeaponBoxData:{ // 武器随机宝箱 id: 武器品质
        112: 3,
        113: 4,
        114: 5,
        115: 6,
    },
    // 武器品质
    weaponQuality: {
        QUALITY_1: 3, // 优秀 R级
        QUALITY_2: 4, // 史诗 S级
        QUALITY_3: 5, // 传说
        QUALITY_4: 6, // 神话
        QUALITY_5: 7, // 至尊
    },

    weaponIdByQuality: {}, // 武器品质对应id
    weaponInfoById: {}, // 武器id对应信息

    /**武器祈愿相关 */
    luckyRefreshCostDiamond: 5, // 武器祈愿刷新花费钻石
    luckyRefreshTime: 20 * 60 * 1000, // 武器祈愿刷新时间 30分钟
    luckyRewardQualityProb: {
        3: 60,
        4: 40,
        5: 0,
        6: 0,
    }, // 武器祈愿奖励品质概率 百分率

    /**=========================装备相关 */
    equipBoxIdLimit: [501, 664], //装备宝箱id范围
    equipBoxData: { // 装备宝箱信息(同item表) phase-品阶 maxColorQuailty-最高品质
        // TODO: 后续还要增加
        501: {phase: 1, maxColorQuailty: 3},
        502: {phase: 2, maxColorQuailty: 3},
        503: {phase: 3, maxColorQuailty: 3},
        504: {phase: 4, maxColorQuailty: 3},
        505: {phase: 5, maxColorQuailty: 3},
        506: {phase: 6, maxColorQuailty: 3},
        551: {phase: 1, maxColorQuailty: 3},
        552: {phase: 2, maxColorQuailty: 3},
        553: {phase: 3, maxColorQuailty: 3},
        554: {phase: 4, maxColorQuailty: 3},
        555: {phase: 5, maxColorQuailty: 3},
        556: {phase: 6, maxColorQuailty: 3},
    },
    equipColorQualityProb: { // 随机装备品质概率 百分率
        1: 50,
        2: 23,
        3: 10,
        4: 8,
        5: 5,
        6: 3,
        7: 1,
    },
    equipAttrCountProb: { // 装备属性个数概率
        1: 7, 
        2: 2, 
        3: 1
    },

    /**=========================宝石相关 */
    GemBoxData: { // 随机宝石宝箱
        // 各宝石品质概率 id: 概率
        708: {1: 9454, 2: 351, 3: 175, 4: 17, 5: 3 }, //关卡随机宝石Ⅰ
        709: {1: 9370, 2: 413, 3: 186, 4: 24, 5: 7 }, //关卡随机宝石Ⅱ
        710: {1: 9288, 2: 478, 3: 197, 4: 31, 5: 10 }, //关卡随机宝石Ⅲ
        751: {1: 9454, 2: 351, 3: 175, 4: 17, 5: 3 }, //关卡随机宝石Ⅰ
        752: {1: 9370, 2: 413, 3: 186, 4: 24, 5: 7 }, //关卡随机宝石Ⅱ
        753: {1: 9288, 2: 478, 3: 197, 4: 31, 5: 10 }, //关卡随机宝石Ⅲ
    },

    /**=========================任务相关 */
    TaskType: {
        "DailyLogin": 1, // 每日首次登录游戏
        "MissionOverReach": 2, // 通关至主线关卡
        "LevelReach": 3, // 玩家等级达到
        "UnlockCommonTalent": 4, // 解锁普通天赋
        "UnlockHighTalent": 5, // 解锁高级天赋
        "GetSWeapon": 6, // 获取S级武器
        "FastBattle": 7, // 扫荡
        "EquipLvWeapon": 8, // 上阵x级武器
        "KillBoss": 9, // 击败首领
        "KillEnemy": 10, // 击败怪物
        "GetGold": 11, // 获得金币
        "GetDiamond": 12, // 获得钻石
        "WeaponCall": 13, // 武器召唤
        "MissionPaicipation": 14, // 参与主线关卡
        "BuyOrAdGetPower": 15, // 购买或看视频得体力
        "GetOfflineReward": 16, // 获取巡逻奖励
        "GetWeapon": 21, // 获得武器
        "WeaponUpgrade": 22, // 武器升级
        "WatchAd": 23, // 看广告(不需要后端判断 有写额外接口)
        "DailyShopBuy": 24, // 每日商店购买物品
        "CostGem": 26, // 消耗钻石
    },

    levelConfig:{}, // 玩家等级配置

    /**=========================商店相关 */
    // 材料宝箱奖池内容 {itemId: 物品id, prob: 概率, count: 数量}
    shopBox_3_reward: [
        {itemId: 6, prob: 125, count: 50},
        {itemId: 6, prob: 63, count: 80},
        {itemId: 6, prob: 32, count: 50},
        {itemId: 110, prob: 125, count: 50},
        {itemId: 110, prob: 63, count: 80},
        {itemId: 110, prob: 5, count: 100},
        {itemId: 110, prob: 32, count: 150},
        {itemId: 110, prob: 13, count: 200},
        {itemId: 134, prob: 32, count: 50},
        {itemId: 134, prob: 13, count: 1},
        {itemId: 134, prob: 7, count: 2},
        {itemId: 137, prob: 63, count: 10},
        {itemId: 137, prob: 47, count: 20},
        {itemId: 137, prob: 32, count: 30},
        {itemId: 121, prob: 32, count: 1},
        {itemId: 122, prob: 13, count: 1},
        {itemId: 123, prob: 63, count: 1},
        {itemId: 135, prob: 7, count: 1},
        {itemId: 136, prob: 19, count: 5},
        {itemId: 136, prob: 13, count: 10},
        {itemId: 136, prob: 7, count: 15},
        {itemId: 133, prob: 19, count: 10},
        {itemId: 133, prob: 10, count: 20},
        {itemId: 3, prob: 13, count: 1},
        {itemId: 3, prob: 7, count: 2},
        {itemId: 3, prob: 4, count: 3},
        {itemId: 109, prob: 7, count: 1},
        {itemId: 109, prob: 4, count: 2},
        {itemId: 139, prob: 63, count: 20},
        {itemId: 139, prob: 32, count: 50},
        {itemId: 139, prob: 13, count: 100},
    ],

    /**=========================离线相关 */
    fastBattleDailyVideoCount: 1, //每天扫荡广告获取次数
    faseBattleDailyPowerCount: 3, //每天扫荡体力获取次数

    /**=========================战斗相关 */
    battleType: {
        COMMON_MISSION: 1, //普通关卡
        ELITE_MISSION: 3, // 精英关卡
        DAILY_CHALLENGE: 4, //每日挑战
    },
    dailyChallengeAutoCost: [1, 20], // 每日挑战自动挑战消耗 [物品id, 数量]
    // 每日挑战周宝箱奖励 box: itemList
    dailyChallengeWeekBoxReward: {
        1: [[110, 50], [122, 3]],
        3: [[2, 300], [109, 1]],
        5: [[554, 5], [1, 100]],
    },
    dailyChallengeMaxCount: 3, //每日挑战最大次数

    /**==========================活动相关 */
}