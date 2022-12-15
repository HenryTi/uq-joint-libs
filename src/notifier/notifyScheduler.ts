import config from 'config';
import { databaseName } from '../db/mysql/database';
import { execSql } from "../db/mysql/tool";
import DefaultNotifier from './defaultNotifier';
import { Notifier } from "./smsNotifier";

export class NotifyScheduler {

    private notifier: Notifier;

    private getLastNotify: string;
    private updateNotify: string;
    private increamErrors: string;

    private enableNotify: boolean = false;
    private notifyInterval: number;
    private maxErrors: number;

    constructor(notifier: Notifier) {
        if (notifier === undefined) {
            notifier = new DefaultNotifier();
        }
        this.notifier = notifier;

        this.getLastNotify = `select UNIX_TIMESTAMP(a.notifiedAt) as notifiedAt, \`errors\` from \`${databaseName}\`.notify a 
            inner join \`${databaseName}\`.moniker m on m.id = a.moniker 
            where m.moniker = ?`;
        this.updateNotify = `insert into \`${databaseName}\`.notify(moniker, notifiedAt, \`errors\`) 
            values((select id from \`${databaseName}\`.moniker where moniker = ?), now(), 0) 
            on duplicate key UPDATE notifiedAt = values(notifiedAt), \`errors\` = 0`;
        this.increamErrors = `insert into \`${databaseName}\`.notify(moniker, notifiedAt, \`errors\`) 
            values((select id from \`${databaseName}\`.moniker where moniker = ?), now(), 1) 
            on duplicate key UPDATE \`errors\` = \`errors\` + 1`;

        if (config.has("joint-enableNotify"))
            this.enableNotify = config.get<boolean>("joint-enableNotify");
        if (config.has("joint-notifyInterval"))
            this.notifyInterval = config.get<number>("joint-notifyInterval");
        else
            this.notifyInterval = 864000;
        if (config.has("joint-notifyMaxErrors"))
            this.maxErrors = config.get<number>("joint-notifyMaxErrors");
        else
            this.maxErrors = 10;
    }

    async notify(moniker: string, id: string) {

        if (!this.enableNotify) return;
        if (!this.notifier) {
            console.warn('nofify scheduler: no valid notifier!');
            return;
        }

        let notifiedAt: number = 0, errors = 0;
        let result = await execSql(this.getLastNotify, [moniker]);
        if (result.length > 0) {
            notifiedAt = result[0].notifiedAt;
            errors = result[0].errors;
        }
        if ((Date.now() / 1000) - this.notifyInterval > notifiedAt || errors >= this.maxErrors) {
            let message = moniker + ":" + id + " joint error, 请速度查看！";
            let success = await this.notifier.notify(message);
            if (success)
                await execSql(this.updateNotify, [moniker])
        } else {
            await execSql(this.increamErrors, [moniker])
        }
    }
}