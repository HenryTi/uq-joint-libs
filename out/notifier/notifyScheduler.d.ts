import { Notifier } from "./smsNotifier";
export declare class NotifyScheduler {
    private notifier;
    private getLastNotify;
    private updateNotify;
    private enableNotify;
    private notifyInterval;
    constructor(notifier: Notifier);
    notify(moniker: string): Promise<void>;
}
