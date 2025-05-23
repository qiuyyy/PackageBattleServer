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
            if (!(num > 0 || (bagItem && bagItem.Num + num >= 0))) return false; // 数量不足
        }
        return true;
    },

    saveUserItem(user, itemId, num) {
        console.log("=============saveUserItem", itemId, num)
        itemId = parseInt(itemId);
        itemNum = parseInt(num);
        let items = [[itemId, num]];
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
                // 检查是否升级
                while (user.Exp >= GameConfig.levelConfig[user.Level - 1].exp) { // 升级
                    user.Exp -= GameConfig.levelConfig[user.Level - 1].exp; // 扣除经验
                    user.Level += 1; // 增加等级
                }
                break;
            case GameConfig.ItemId.Energy:
                break;
            case GameConfig.ItemId.ARENA_COIN:
                break;
            case GameConfig.ItemId.WeaponBlueprintRandom:
                const blueprints = module.exports.getRandomWeaponBlueprint(num); // 生成武器图纸并存入
                items = blueprints;
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
        return items;
    },

    // 获取随机武器
    getRandomWeapon(quality) {
        if (!quality) {
            quality = getRandomProperty(GameConfig.weaponQuality);
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

    // 等级配置
    loadLevelConfig() {
        // 读取配置json文件
        const data = fs.readFileSync(path.join(__dirname, '../config/Level.json'), 'utf8');
        const config = JSON.parse(data);
        GameConfig.levelConfig = config; // 保存
        console.log("读取等级配置成功");
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