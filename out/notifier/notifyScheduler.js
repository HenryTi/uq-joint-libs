"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyScheduler = void 0;
const config_1 = __importDefault(require("config"));
const database_1 = require("../db/mysql/database");
const tool_1 = require("../db/mysql/tool");
const defaultNotifier_1 = __importDefault(require("./defaultNotifier"));
class NotifyScheduler {
    constructor(notifier) {
        this.enableNotify = false;
        if (notifier === undefined) {
            notifier = new defaultNotifier_1.default();
        }
        this.notifier = notifier;
        this.getLastNotify = `select UNIX_TIMESTAMP(a.notifiedAt) as notifiedAt, \`errors\` from \`${database_1.databaseName}\`.notify a 
            inner join \`${database_1.databaseName}\`.moniker m on m.id = a.moniker 
            where m.moniker = ?`;
        this.updateNotify = `insert into \`${database_1.databaseName}\`.notify(moniker, notifiedAt, \`errors\`) 
            values((select id from \`${database_1.databaseName}\`.moniker where moniker = ?), now(), 0) 
            on duplicate key UPDATE notifiedAt = values(notifiedAt), \`errors\` = 0`;
        this.increamErrors = `insert into \`${database_1.databaseName}\`.notify(moniker, notifiedAt, \`errors\`) 
            values((select id from \`${database_1.databaseName}\`.moniker where moniker = ?), now(), 1) 
            on duplicate key UPDATE \`errors\` = \`errors\` + 1`;
        if (config_1.default.has("joint-enableNotify"))
            this.enableNotify = config_1.default.get("joint-enableNotify");
        if (config_1.default.has("joint-notifyInterval"))
            this.notifyInterval = config_1.default.get("joint-notifyInterval");
        else
            this.notifyInterval = 864000;
        if (config_1.default.has("joint-notifyMaxErrors"))
            this.maxErrors = config_1.default.get("joint-notifyMaxErrors");
        else
            this.maxErrors = 10;
    }
    async notify(moniker, id) {
        if (!this.enableNotify)
            return;
        if (!this.notifier) {
            console.warn('nofify scheduler: no valid notifier!');
            return;
        }
        let notifiedAt = 0, errors = 0;
        let result = await (0, tool_1.execSql)(this.getLastNotify, [moniker]);
        if (result.length > 0) {
            notifiedAt = result[0].notifiedAt;
            errors = result[0].errors;
        }
        if ((Date.now() / 1000) - this.notifyInterval > notifiedAt || errors >= this.maxErrors) {
            let message = moniker + ":" + id + " joint error, 请速度查看！";
            let success = await this.notifier.notify(message);
            if (success)
                await (0, tool_1.execSql)(this.updateNotify, [moniker]);
        }
        else {
            await (0, tool_1.execSql)(this.increamErrors, [moniker]);
        }
    }
}
exports.NotifyScheduler = NotifyScheduler;
//# sourceMappingURL=notifyScheduler.js.map