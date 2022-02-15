import { Notifier } from "./smsNotifier";
export declare class NotifyScheduler {
    private notifier;
    private getLastNotify;
    private updateNotify;
    private increamErrors;
    private enableNotify;
    private notifyInterval;
    private maxErrors;
    constructor(notifier: Notifier);
    notify(moniker: string, id: string): Promise<void>;
}
