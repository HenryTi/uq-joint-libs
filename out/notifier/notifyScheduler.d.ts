export declare class NotifyScheduler {
    private notifier;
    private getLastNotify;
    private updateNotify;
    private enableNotify;
    private notifyInterval;
    constructor();
    notify(moniker: string): Promise<void>;
}
