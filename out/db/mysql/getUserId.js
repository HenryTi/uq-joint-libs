"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = void 0;
const database_1 = require("./database");
const tool_1 = require("./tool");
async function getUserId(webUserID) {
    try {
        let sql = `select id from \`${database_1.databaseName}\`.\`map_webuser_webuser\` where no='${webUserID}'`;
        let ret = await tool_1.execSql(sql);
        if (ret.length === 1)
            return ret[0]['id'];
    }
    catch (err) {
        throw err;
    }
    return -1;
}
exports.getUserId = getUserId;
//# sourceMappingURL=getUserId.js.map