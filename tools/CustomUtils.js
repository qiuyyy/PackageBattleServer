var $DesMg = require("./DesMg");
var GameConfig = require("./GameConfig");
var path = require('path'); //系统路径模块
const fs = require('fs');
module.exports = {
    formatResponse(data, code = GameConfig.NetCode.OK, msg = "success") {
        return $DesMg.default.encode(
            JSON.stringify({
                code,
                msg,
                data,
            })
        );
    },

    // 检查物品是否足够 [[itemId, num]]
    checkItemIsEnough(user, list) {
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const itemId = item[0]; // 物品ID
            const num = item[1]; // 数量 
            let bagItem = user.api.bagInfo.find(item => item.Itemid == itemId); // 查找背包物品
            if (!bagItem || bagItem.Num - num < 0) return false; // 数量不足
        }
        return true;
    },

    //存入/扣除物品 检查物品是否足够并扣除物品 num:变化数量
    /**
     * @param {*} user 
     * @param {*} itemId 物品id
     * @param {*} num 数量
     * @returns {
     * items: 物品[[itemId, num]],
     * roleEquips: 装备 [{RoleEquipSchema}]
     * levelup：升级信息 {LevelOld-旧等级, LevelNew-新等级, Exp-经验, Rewards-升级奖励}
     * }
     */
    saveUserItem(user, itemId, num) {
        console.log("=============saveUserItem", itemId, num)
        itemId = parseInt(itemId);
        itemNum = parseInt(num);
        let obj = {items: [[itemId, num]]}; // 获得列表
        switch (itemId) {
            case GameConfig.ItemId.Gold:
                if (user.Gold + num < 0) return false;
                user.Gold += num;
                break;
            case GameConfig.ItemId.Diamond:
                if (user.Diamond + num < 0) return false;
                user.Diamond += num;
                break;
            case GameConfig.ItemId.Power:
                if (user.Power + num < 0) return false;
                user.Power += num;
                // 非满体力时，开始恢复计时
                if (user.Power < user.MaxPower) {
                    user.PowerRecoveryStartTime = Math.floor(new Date().getTime() / 1000); // 恢复计时
                } else {
                    user.PowerRecoveryStartTime = 0; // 恢复计时
                }
                break;
            case GameConfig.ItemId.Exp:
                if (user.Exp + num < 0) return false;
                user.Exp += num;
                let oldLevel = user.Level;
                // 检查是否升级
                let lvUpReward = []; // 升级奖励
                while (user.Exp >= GameConfig.levelConfig[user.Level - 1].exp) { // 升级
                    user.Exp -= GameConfig.levelConfig[user.Level - 1].exp; // 扣除经验
                    lvUpReward = module.exports.pushItemsToList(lvUpReward, GameConfig.levelConfig[user.Level - 1].Rewards);
                    user.Level += 1; // 增加等级
                }
                obj.levelup = {
                    LevelOld: oldLevel, // 旧等级
                    LevelNew: user.Level, // 新等级
                    Exp: user.Exp, // 经验
                    Rewards: module.exports.saveUserItemList(user, lvUpReward).items || [] // 升级奖励
                }
                break;
            case GameConfig.ItemId.Energy:
                break;
            case GameConfig.ItemId.ARENA_COIN:
                break;
            case GameConfig.ItemId.WeaponBlueprintRandom:
                const blueprints = module.exports.getRandomWeaponBlueprint(num); // 生成武器图纸并存入
                obj.items = blueprints;
                blueprints.forEach(element => {
                    const id = element[0];
                    const count = element[1];
                    let bagItem = user.api.bagInfo.find(item => item.Itemid == id);
                    if (bagItem) {
                        bagItem.Num += count; // 增加数量 
                    } else {
                        // 新增物品
                        user.api.bagInfo.push({ Itemid: id, Num: count }); 
                    }
                })
                break;
            case GameConfig.ItemId.EquipBlueprintRandom:
                // TODO: 生成装备图纸并存入
                obj.items = [];
                break;
            case GameConfig.ItemId.EquipBox_1:
                // TODO: 生成装备并存入
                obj.items = [];
                break;
            default:
                // 背包物品 || 天赋书
                let bagItem = user.api.bagInfo.find(item => item.Itemid == itemId);
                if (!(num > 0 || (bagItem && bagItem.Num + num >= 0))) return false; // 数量不足
                if (bagItem) {
                    bagItem.Num += num; // 增加数量 
                } else {
                    // 新增物品
                    user.api.bagInfo.push({ Itemid: itemId, Num: num }); 
                }
                break;
        }
        return obj;
    },

    // 存储物品列表
    saveUserItemList(user, list) {
        let obj = {};
        list.forEach(element => {
            const itemId = element[0];
            const num = element[1];
            let resObj = module.exports.saveUserItem(user, itemId, num);
            if (resObj.items) {
                obj.items = module.exports.pushItemsToList(obj.items, resObj.items);
            }
            if (resObj.roleEquips) {
                obj.roleEquips = (obj.roleEquips || []).concat(resObj.roleEquips)
            }
            if (resObj.levelup) {
                obj.levelup = resObj.levelup;
            }
        })
        return obj;
    },

    // 添加装备
    addEquipToUser(user, equipIds) {
        for (let i = 0; i < equipIds.length; i++) {
            const equipId = equipIds[i];
            user.RoleEquips.push({
                Cfg: equipId,
                DecomNum: 1,
                ExtraAttrs: [],
                PreviewExtraAttrs: [],
                Qcost: 0,
            });
        }
    },

    // 向一个item格式([[id, num]])列表添加物品 mult-倍数
    pushItemsToList(list, pushList, mult) {
        mult = mult || 1;
        list = list || [];
        pushList = pushList || [];
        let obj = module.exports.formatItemsToObj(list);
        pushList.forEach(element => {
            const id = element[0];
            const count = element[1];
            if (obj[id]) {
                obj[id] += count * mult; // 增加数量 
            } else {
                // 新增物品
                obj[id] = count * mult; 
            }
        })
        return module.exports.formatItemsToArr(obj);
    },

    // 物品数据格式转换 [[itemId, num]] => {itemId: num}
    formatItemsToObj(items) {
        let data = {};
        items.forEach(element => {
            const id = element[0];
            const count = element[1];
            data[id] = count; // 保存
        })
        return data;
    },

    // 物品格式转换 {itemId: num} => [[itemId, num]]
    formatItemsToArr(items) {
        let data = [];
        for (const [id, count] of Object.entries(items)) { // 遍历
            data.push([Number(id), count]); // 保存
        }
        return data;
    },

    // 获取随机武器
    getRandomWeapon(quality) {
        if (!quality) {
            quality = module.exports.getRandomProperty(GameConfig.weaponQuality);
        }
        let list = GameConfig.weaponIdByQuality[quality];
        if (!list) return null; // 不存在
        const randomNum = Math.floor(Math.random() * list.length); // 随机
        return list[randomNum];
    },

    // 随机获取对象的一个属性值
    getRandomProperty(obj) {
        // 获取对象的所有属性名
        const keys = Object.keys(obj);
        // 如果对象为空，返回null
        if (keys.length === 0) return null;
        // 随机选择一个属性名
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        // 返回对应的属性值
        return obj[randomKey];
    },

    // 根据概率获取随机值 {key: prob}
    getRandomByProb(list) {
        const totalProb = Object.values(list).reduce((sum, prob) => sum + prob, 0); // 计算总概率
        const randomNum = Math.floor(Math.random() * totalProb) + 1; // 生成随机数
        let cumulativeProb = 0; // 累积概率
        for (const [key, prob] of Object.entries(list)) { // 遍历概率列表
            cumulativeProb += prob; // 累积概率
            if (randomNum <= cumulativeProb) { // 判断是否命中
                return key; // 返回对应的id
            }
        }
    },

    // 获取随机武器图纸
    getRandomWeaponBlueprint(num) {
        // 随机生成num个1-9整数，并将相同的整数组合成数组
        const blueprints = {};
        for (let i = 0; i < num; i++) {
            const randomNum = Math.floor(Math.random() * 9) + 1;
            let itemId = 100 + randomNum;
            if (itemId == 109) itemId = 146; //9型图纸id为146
            if (blueprints[itemId]) {
                blueprints[itemId]++;
            } else {
                blueprints[itemId] = 1;
            }
        }
        // 更改为[id, num]格式
        let arr = [];
        for (const [id, count] of Object.entries(blueprints)) {
            arr.push([Number(id), count]);
        }
        return arr;
    },

    // 获取密钥
    getSercetKey() {
        return process.env.JWT_SECRET || 'fallback-secret-key'; // 设置一个密钥
    },

    // 首字母小写
    firstLetterToLower(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    },

    // 读取数据配置
    loadCommonJsonConfig(list) {
        // 读取配置json文件
        if (!list) list = [];
        list.forEach(name => {
            const data = fs.readFileSync(path.join(__dirname, `../config/${name}.json`), 'utf8');
            const config = JSON.parse(data);
            GameConfig[module.exports.firstLetterToLower(name) + "Config"] = config; // 保存
            console.log(`读取${name}配置成功`);
        })
    },

    // 读取武器配置json文件，并保存为易读格式
    loadWeaponConfig() {
        // 读取配置json文件
        const data = fs.readFileSync(path.join(__dirname, '../config/EquipBase.json'), 'utf8');
        const config = JSON.parse(data);
        let byQuality = {}; // 保存武器品质对应id
        let byId = {}; // 保存武器id对应配置
        config.forEach(element => {
            if (!element.Pass) { //非可上阵武器
                byId[element.EquipID] = element;
                let q = byQuality[element.EquipQuality]; // 初始化
                if (!q) {
                    q = []; // 初始化
                    byQuality[element.EquipQuality] = q; // 保存
                }
                q.push(element.EquipID); // 保存
            }
        })
        GameConfig.weaponIdByQuality = byQuality; // 保存
        GameConfig.weaponInfoById = byId; // 保存
        console.log("读取武器配置成功");
    },
}