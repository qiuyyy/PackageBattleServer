module.exports = {
    // 上阵武器格解锁条件 {通关关卡解锁}
    equipTableUnlockCondition : {
        "0": {chapterId: 0},
        "1": {chapterId: 0},
        "2": {chapterId: 0},
        "3": {chapterId: 0},
        "4": {chapterId: 0},
        "5": {chapterId: 0},
        "6": {chapterId: 2},
        "7": {chapterId: 4},
        "8": {chapterId: 6},
    },

    // 通讯code
    NetCode : {
        FAIL: -1,
        OK: 0,
        LoginDisabled: 1001,
        OtherLogin: 1002,
        VersionLow: 1003,
        RepeatedSettlement: 1004,
        StopServer: 1005,
        NoGmoney: -999,
        EquipTableEnough: -2
    },

    // 特殊物品id
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
    },


    // 体力相关
    adGetPowerCount: 5, //广告获取数量
    gemGetPowerCount: 15, //购买获取数量
    gemGetPowerCost: 30, // 钻石购买体力消耗
    battlePowerCost: 5, //战斗体力消耗
    POWER_RECOVERY_CD: 1200, // 恢复1体力cd

    // 武器品质
    weaponQuality: {
        QUALITY_1: 3, // 优秀
        QUALITY_2: 4, // 史诗
        QUALITY_3: 5, // 传说
        QUALITY_4: 6, // 神话
        QUALITY_5: 7, // 至尊
    },

    weaponIdByQuality: {}, // 武器品质对应id
    weaponInfoById: {}, // 武器id对应信息

    /**武器祈愿相关 */
    luckyRefreshCostDiamond: 5, // 武器祈愿刷新花费钻石
    luckyRefreshTime: 30 * 60 * 1000, // 武器祈愿刷新时间 30分钟
    luckyRewardQualityProb: {
        3: 30,
        4: 50,
        5: 15,
        6: 5,
    }, // 武器祈愿奖励品质概率 百分率

    levelConfig:{}, // 等级配置
}