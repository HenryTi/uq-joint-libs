import config from 'config';
import fetch from "node-fetch";


export class SmsNotifier {

    private smsServer: any;
    private isReady: boolean;
    constructor() {
        // super(smsServer.baseUrl);
        if (config.has("joint-SmsServer")) {
            this.smsServer = config.get<any>("joint-SmsServer");
            this.isReady = true;
        }
        else {
            this.isReady = false;
            console.warn('smsServer is not ready!');
        }
    }

    async notify(message: string): Promise<boolean> {

        if (this.isReady) {
            let { baseUrl, un, pw, dc, tf, mobile, messageHeader } = this.smsServer;
            message = encodeURI(messageHeader + message);
            let response = await fetch(`${baseUrl}mt?un=${un}&pw=${pw}&da=${mobile}&dc=${dc}&tf=${tf}&sm=${message}`, undefined);
            if (response.status === 200) {
                return true;
                // let result = await response.text();
            }
        }
        return false;
    }
}