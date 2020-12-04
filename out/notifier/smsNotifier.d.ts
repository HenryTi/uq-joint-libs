export declare class SmsNotifier {
    private smsServer;
    private isReady;
    constructor();
    notify(message: string): Promise<boolean>;
}
