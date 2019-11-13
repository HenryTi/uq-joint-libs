"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uq_1 = require("./uq");
const $unitx = '$$$/$unitx';
class Uqs {
    constructor(unit) {
        //private joint: Joint;
        this.uqs = {};
        this.unit = unit;
    }
    /*
    async getOpenApi(uq: string): Promise<UqApi> {
        return await this.joint.getOpenApi(uq);
    }
    */
    async getUq(uqFullName) {
        let uq = this.uqs[uqFullName];
        if (uq !== undefined)
            return uq;
        return this.uqs[uqFullName] = await this.createUq(uqFullName);
    }
    async createUq(uqFullName) {
        let uq = new uq_1.Uq(this, uqFullName);
        await uq.init();
        this.uqs[uqFullName] = uq;
        return uq;
    }
    async init() {
        this.unitx = new uq_1.UqUnitx(this, $unitx);
        await this.unitx.init();
    }
    async readBus(face, queue) {
        return await this.unitx.readBus(face, queue);
    }
    async writeBus(face, source, newQueue, busVersion, body) {
        await this.unitx.writeBus(face, source, newQueue, busVersion, body);
    }
}
exports.Uqs = Uqs;
//# sourceMappingURL=uqs.js.map