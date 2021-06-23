import config from 'config';
import { databaseName } from '../db/mysql/database';
import { execSql } from "../db/mysql/tool";
import { Notifier } from "./smsNotifier";

export class NotifyScheduler {

    private notifier: Notifier;
    private getLastNotify: string;
    private updateNotify: string;
    private enableNotify: boolean = false;
    private notifyInterval: number;
    constructor(notifier: Notifier) {
        this.notifier = notifier;

        this.getLastNotify = `select UNIX_TIMESTAMP(a.notifiedAt) as notifiedAt from \`${databaseName}\`.notify a inner join \`${databaseName}\`.moniker m on m.id = a.moniker 
            where m.moniker = ?`;
        this.updateNotify = `insert into \`${databaseName}\`.notify(moniker, notifiedAt) 
            values((select id from \`${databaseName}\`.moniker where moniker = ?), now()) on duplicate key UPDATE notifiedAt = values(notifiedAt)`;
        if (config.has("joint-enableNotify"))
            this.enableNotify = config.get<boolean>("joint-enableNotify");
        if (config.has("joint-notifyInterval"))
            this.notifyInterval = config.get<number>("joint-notifyInterval");
        else
            this.notifyInterval = 864000;
    }

    async notify(moniker: string) {

        if (!this.enableNotify) return;
        if (!this.notifier) {
            console.warn('nofify scheduler: no valid notifier!');
            return;
        }

        let notifiedAt: number = 0;
        let result = await execSql(this.getLastNotify, [moniker]);
        if (result.length > 0) {
            notifiedAt = result[0].notifiedAt;
        }
        if ((Date.now() / 1000) - this.notifyInterval > notifiedAt) {
            let message = moniker + " joint error, 请速度查看！";
            let success = await this.notifier.notify(message);
            if (success)
                await execSql(this.updateNotify, [moniker])
        }
    }
}