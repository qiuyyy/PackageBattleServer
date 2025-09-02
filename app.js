var express = require('express');
const User = require('./models/User');
var app = express();
var $DesMg = require("./tools/DesMg");
const mongoose = require('mongoose');
const { getSercetKey } = require('./tools/CustomUtils');
const jwt = require('jsonwebtoken'); // 新增jwt库
const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginRoutes');
const clientRoutes = require('./routes/clientRoutes');
const equipRoutes = require('./routes/equipRoutes');
const battleRoutes = require('./routes/battleRoutes');
const shopRoutes = require('./routes/shopRoutes');
const ttRoutes = require('./routes/ttRoutes');
const taskRoutes = require('./routes/taskRoutes');
const GameConfig = require('./tools/GameConfig');
const fs = require('fs');
const https = require('https');
const { loadWeaponConfig, loadCommonJsonConfig, formatResponse } = require('./tools/CustomUtils');

// token验证中间件
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    if (!token) return next();
    
    jwt.verify(token, getSercetKey(), async (err, decoded) => {
        if (err) {
            // 检查是否为token过期错误
            if (err.name === 'TokenExpiredError') {
                return res.json(formatResponse({}, 401, GameConfig.NetFailMsgCode.TokenExpires));
            }
            // 其他验证错误（无效签名、格式错误等）
            return res.json(formatResponse({}, 403, GameConfig.NetFailMsgCode.TokenError));
        }

        // 检查token是否即将过期（剩余时间小于30分钟）
        const currentTime = Date.now() / 1000; // 当前时间（秒）
        const expiresIn = decoded.exp; // token过期时间（秒）
        const timeLeft = expiresIn - currentTime;
        const threshold = 30 * 60; // 30分钟阈值（秒）
        // 如果即将过期，生成新token
        if (timeLeft > 0 && timeLeft < threshold) {
            const newToken = jwt.sign(
                { openid: decoded.openid },
                getSercetKey(),
                { expiresIn: '3h' } // 新token有效期3小时
            );
            // 在响应头中返回新token
            res.setHeader('X-Refresh-Token', newToken);
        }

        try { // ✅ 添加错误捕获
            // 获取用户信息
            const info = await User.getUserByToken(token);
            // console.log("find user:", info);
            if (!info) {
                return res.status(404).json({ error: 'User not found' });
            }
            req.user = info;
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.json(formatResponse({}, 403, GameConfig.NetFailMsgCode.TokenError));
        }
    });
}

// 解决跨域问题
const cors = require('cors');
app.use(cors({
    exposedHeaders: ['X-Refresh-Token'], // 暴露自定义响应头
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', // 生产环境限制源
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析json格式的表单数据
// app.use(express.json())
// 自定义 JSON 解析中间件
app.use((req, res, next) => { 
    if (req.headers['content-type'] === 'application/json') { 
        express.json()(req, res, (err) => { 
            if (err) { 
                try { 
                    // 需要解码 
                    const r = $DesMg.default.decode(err.body) 
                    req.body = JSON.parse(r); 
                } catch (decodeErr) { 
                    console.error('JSON 解码失败:', decodeErr); 
                    return res.status(400).json({ error: 'Invalid JSON data' }); 
                } 
            } 
            // 确保 req.body 存在 
            req.body = req.body || {}; 
            next(); 
            console.log("=================", req.originalUrl) 
            console.log(req.body); 
        }); 
    } else { 
        // 确保非 JSON 请求也有 req.body 
        req.body = req.body || {}; 
        next(); 
    } 
}); 

app.use(authenticateToken);

app.use(userRoutes);
app.use(loginRoutes);
app.use(clientRoutes);
app.use(equipRoutes);
app.use(battleRoutes);
app.use(shopRoutes);
app.use(ttRoutes);
app.use(taskRoutes);

app.get('/index.html', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
 })

app.get('/', function(req, res) {
    res.send("Hello World!");
})

loadWeaponConfig();
loadCommonJsonConfig(["Level","TrainRewards","RoleEquipUpgrade"]);

// 监听端口
const PORT = 3000;
// 移除 HTTP 服务器代码
const server = app.listen(PORT, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port);
})

// 读取SSL证书和私钥
const options = {
    key: fs.readFileSync('./ssl/yuandianhuyu.com.key'),
    cert: fs.readFileSync('./ssl/yuandianhuyu.com.pem')
};
// 启动服务器
// const httpsServer = https.createServer(options, app);
// httpsServer.listen(PORT, () => {
//     console.log(`HTTPS server running on port ${PORT}`);
// });

// 连接 MongoDB
const database = 'PackageBattleDB'; 
const username = 'adminUser001'; 
const password = 'adminPass001'; 
const host = 'localhost';
const mongoPort = '27017';

const connectionString = `mongodb://${username}:${password}@${host}:${mongoPort}/${database}`;
mongoose.connect(connectionString).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
});