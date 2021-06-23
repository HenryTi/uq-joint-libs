
export interface Notifier {
    notify(message): Promise<boolean>;
}