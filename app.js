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
const GameConfig = require('./tools/GameConfig');
const { loadWeaponConfig, loadLevelConfig } = require('./tools/CustomUtils');

// token验证中间件
function authenticateToken(req, res, next) {
    const token = req.body.token;
    
    if (!token) return next();
    
    jwt.verify(token, getSercetKey(), async (err, user) => {
        if (err) return res.sendStatus(403);
        // 获取用户信息
        const info = await User.getUserByToken(token);
        console.log("find user:", info);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.user = info;
        next();
    });
}

// 解决跨域问题
const cors = require('cors');
app.use(cors());

// 解析json格式的表单数据
// app.use(express.json())
// 自定义 JSON 解析中间件
app.use((req, res, next) => {
    if (req.headers['content-type'] === 'application/json') {
        express.json()(req, res, (err) => {
            if (err) {
                // 需要解码
                const r = $DesMg.default.decode(err.body)
                req.body = JSON.parse(r);
            }
            next();
            console.log("=================", req.originalUrl)
            console.log(req.body);
        });
    } else {
        next();
    }
});

app.use(authenticateToken);

app.use(userRoutes);
app.use(loginRoutes);
app.use(clientRoutes);
app.use(equipRoutes);
app.use(battleRoutes);
 
app.get('/index.html', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
 })

app.get('/', function(req, res) {
    res.send("Hello World!");
})

loadWeaponConfig();
loadLevelConfig();

// 监听端口
const PORT = 3000;

const server = app.listen(PORT, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port);
})

// 连接 MongoDB
const database = 'PackageBattleDB'; 
const username = 'neighborAdmin02'; 
const password = 'neighbor0316'; 
const host = 'localhost';
const mongoPort = '27017';

// const connectionString = `mongodb://${username}:${password}@${host}:${mongoPort}/${database}`;
const connectionString = `mongodb://${host}:${mongoPort}/${database}`;
mongoose.connect(connectionString).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
});