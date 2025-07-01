module.exports = {
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

    /** 通讯失败原因
     * ITEM_NOT_ENOUGH 物品数量不足
     * BATTLE_ID_NOT_MATCH 战斗id不匹配
     * FAIL_GET 获取失败
     * INVALID_EQUIP 装备不存在
     * FAIL 失败
     * CODE_IS_ERROR 验证码错误
     */

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
    
    /**=========================体力相关 */ 
    adGetPowerCount: 5, //广告获取数量
    gemGetPowerCount: 15, //购买获取数量
    gemGetPowerCost: 30, // 钻石购买体力消耗
    battlePowerCost: 5, //战斗体力消耗
    POWER_RECOVERY_CD: 1200, // 恢复1体力cd（同前端一致）

    /**=========================武器相关 */
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
        551: {phase: 1, maxColorQuailty: 3},
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

    levelConfig:{}, // 玩家等级配置

    /**=========================离线相关 */
    offlineDayAdCount: 2, //每天扫荡广告获取次数
    offlineDayPowerCount: 3, //每天扫荡体力获取次数
}