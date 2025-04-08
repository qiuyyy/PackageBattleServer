const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatResponse, getSercetKey } = require('../tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库

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

module.exports = router;