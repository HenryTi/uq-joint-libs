export interface Notifier {
    notify(message: any): Promise<boolean>;
}
