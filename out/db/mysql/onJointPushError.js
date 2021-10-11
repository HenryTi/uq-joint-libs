"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onJointPushError = void 0;
const database_1 = require("./database");
const tool_1 = require("./tool");
async function onJointPushError(failedId, reason) {
    try {
        if (typeof failedId === 'number') {
            let sql = `insert into \`${database_1.databaseName}\`.queue_in_failed(id, reason) 
            values(${failedId}, '${reason}') on duplicate key update reason = values(reason), date = CURRENT_TIMESTAMP;`;
            await (0, tool_1.execSql)(sql);
        }
    }
    catch (err) {
        throw err;
    }
}
exports.onJointPushError = onJointPushError;
//# sourceMappingURL=onJointPushError.js.map