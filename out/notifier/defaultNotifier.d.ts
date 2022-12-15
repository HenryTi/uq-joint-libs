import { Notifier } from "./smsNotifier";
export default class DefaultNotifier implements Notifier {
    notify(message: any): Promise<boolean>;
}
