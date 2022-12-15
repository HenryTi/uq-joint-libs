import { Notifier } from "./smsNotifier";

export default class DefaultNotifier implements Notifier {

    async notify(message: any): Promise<boolean> {
        console.log(message);
        return true;
    }
}