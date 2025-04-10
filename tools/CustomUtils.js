var $DesMg = require("./DesMg");
var GameConfig = require("./GameConfig");
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

    saveUserItem(user, itemId, num) {
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
                break;
            case GameConfig.ItemId.Exp:
                if (user.Exp + num < 0) return false;
                user.Exp += num;
                break;
            case GameConfig.ItemId.DNA_SMALL:
                if (user.DNA_SMALL + num < 0) return false;
                user.DNA_SMALL += num;
                break;
            case GameConfig.ItemId.Energy:
                break;
            case GameConfig.ItemId.ARENA_COIN:
                break;
            case GameConfig.ItemId.WeaponBlueprintRandom:
                // 随机生成num个1-9整数，并将相同的整数组合成数组
                const blueprints = {};
                for (let i = 0; i < num; i++) {
                    const randomNum = Math.floor(Math.random() * 9) + 1;
                    let itemId = 100 + randomNum;
                    if (blueprints[itemId]) {
                        blueprints[itemId]++;
                    } else {
                        blueprints[itemId] = 1;
                    }
                }
                for (const [id, count] of Object.entries(blueprints)) {
                    let bagItem = user.api.bagInfo.find(item => item.Itemid == id);
                    if (bagItem) {
                        bagItem.Num += count; // 增加数量 
                    } else {
                        // 新增物品
                        user.api.bagInfo.push({ Itemid: id, Num: count }); 
                    }
                }
                break;
            case GameConfig.ItemId.EquipBlueprintRandom:
                // TODO: 生成装备图纸并存入
                break;
            default:
                // 背包物品
                let bagItem = user.api.bagInfo.find(item => item.Itemid == itemId);
                if (bagItem.Num + num < 0) return false;
                if (bagItem) {
                    bagItem.Num += num; // 增加数量 
                } else {
                    // 新增物品
                    user.api.bagInfo.push({ Itemid: itemId, Num: num }); 
                }
                break;
        }
        return true;
    },

    // 获取密钥
    getSercetKey() {
        return process.env.JWT_SECRET || 'fallback-secret-key'; // 设置一个密钥
    }
}