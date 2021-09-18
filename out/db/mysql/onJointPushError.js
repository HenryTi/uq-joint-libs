"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onJointPushError = void 0;
const database_1 = require("./database");
const tool_1 = require("./tool");
async function onJointPushError(failedId) {
    try {
        if (typeof failedId === 'number') {
            let sql = `insert into \`${database_1.databaseName}\`.queue_in_failed(id) values(${failedId}) on duplicate key update date = CURRENT_TIMESTAMP;`;
            await tool_1.execSql(sql);
        }
    }
    catch (err) {
        throw err;
    }
}
exports.onJointPushError = onJointPushError;
//# sourceMappingURL=onJointPushError.js.map