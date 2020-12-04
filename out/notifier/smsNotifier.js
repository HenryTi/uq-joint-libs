"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsNotifier = void 0;
const config_1 = __importDefault(require("config"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class SmsNotifier {
    constructor() {
        // super(smsServer.baseUrl);
        if (config_1.default.has("joint-SmsServer")) {
            this.smsServer = config_1.default.get("joint-SmsServer");
            this.isReady = true;
        }
        else {
            this.isReady = false;
            console.warn('smsServer is not ready!');
        }
    }
    async notify(message) {
        if (this.isReady) {
            let { baseUrl, un, pw, dc, tf, mobile, messageHeader } = this.smsServer;
            message = encodeURI(messageHeader + message);
            let response = await node_fetch_1.default(`${baseUrl}mt?un=${un}&pw=${pw}&da=${mobile}&dc=${dc}&tf=${tf}&sm=${message}`, undefined);
            if (response.status === 200) {
                return true;
                // let result = await response.text();
            }
        }
        return false;
    }
}
exports.SmsNotifier = SmsNotifier;
//# sourceMappingURL=smsNotifier.js.map