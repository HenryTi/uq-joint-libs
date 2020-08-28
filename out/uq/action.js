"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSubmitCaller = exports.Action = void 0;
const entity_1 = require("./entity");
const caller_1 = require("./caller");
class Action extends entity_1.Entity {
    get typeName() { return 'action'; }
    async submit(data) {
        //await this.loadSchema();
        //let text = this.pack(data);
        //return await this.uqApi.action(this.name, {data:text});
        return await new ActionSubmitCaller(this, data).request();
    }
    async submitReturns(data) {
        /*
        await this.loadSchema();
        let text = this.pack(data);
        let result = await this.uqApi.actionReturns(this.name, {data:text});
        */
        return await new SubmitReturnsCaller(this, data).request();
    }
}
exports.Action = Action;
class ActionSubmitCaller extends caller_1.ActionCaller {
    get path() { return 'action/' + this.entity.name; }
    buildParams() { return { data: this.entity.pack(this.params) }; }
}
exports.ActionSubmitCaller = ActionSubmitCaller;
class SubmitReturnsCaller extends ActionSubmitCaller {
    get path() { return 'action/' + this.entity.name + '/returns'; }
    xresult(res) {
        let { returns } = this.entity;
        let len = returns.length;
        let ret = {};
        for (let i = 0; i < len; i++) {
            let retSchema = returns[i];
            ret[retSchema.name] = res[i];
        }
        return ret;
    }
}
//# sourceMappingURL=action.js.map