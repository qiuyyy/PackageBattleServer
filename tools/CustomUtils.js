var $DesMg = require("./DesMg");
module.exports = {
    formatResponse(data, code = 0, msg = "success") {
        // return {
        //         code,
        //         msg,
        //         data,
        //     }
        return $DesMg.default.encode(
            JSON.stringify({
                code,
                msg,
                data,
            })
        );
    },

    // 获取密钥
    getSercetKey() {
        return process.env.JWT_SECRET || 'fallback-secret-key'; // 设置一个密钥
    }
}