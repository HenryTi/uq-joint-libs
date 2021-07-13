"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyScheduler = void 0;
const config_1 = __importDefault(require("config"));
const database_1 = require("../db/mysql/database");
const tool_1 = require("../db/mysql/tool");
class NotifyScheduler {
    constructor(notifier) {
        this.enableNotify = false;
        this.notifier = notifier;
        this.getLastNotify = `select UNIX_TIMESTAMP(a.notifiedAt) as notifiedAt from \`${database_1.databaseName}\`.notify a inner join \`${database_1.databaseName}\`.moniker m on m.id = a.moniker 
            where m.moniker = ?`;
        this.updateNotify = `insert into \`${database_1.databaseName}\`.notify(moniker, notifiedAt) 
            values((select id from \`${database_1.databaseName}\`.moniker where moniker = ?), now()) on duplicate key UPDATE notifiedAt = values(notifiedAt)`;
        if (config_1.default.has("joint-enableNotify"))
            this.enableNotify = config_1.default.get("joint-enableNotify");
        if (config_1.default.has("joint-notifyInterval"))
            this.notifyInterval = config_1.default.get("joint-notifyInterval");
        else
            this.notifyInterval = 864000;
    }
    async notify(moniker, id) {
        if (!this.enableNotify)
            return;
        if (!this.notifier) {
            console.warn('nofify scheduler: no valid notifier!');
            return;
        }
        let notifiedAt = 0;
        let result = await tool_1.execSql(this.getLastNotify, [moniker]);
        if (result.length > 0) {
            notifiedAt = result[0].notifiedAt;
        }
        if ((Date.now() / 1000) - this.notifyInterval > notifiedAt) {
            let message = moniker + ":" + id + " joint error, 请速度查看！";
            let success = await this.notifier.notify(message);
            if (success)
                await tool_1.execSql(this.updateNotify, [moniker]);
        }
    }
}
exports.NotifyScheduler = NotifyScheduler;
//# sourceMappingURL=notifyScheduler.js.map