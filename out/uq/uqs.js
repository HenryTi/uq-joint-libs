"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uqs = void 0;
const uq_1 = require("./uq");
const $unitx = '$$$/$unitx';
class Uqs {
    constructor(unit, userName, password) {
        this.uqs = {};
        this.unit = unit;
        this.userName = userName;
        this.password = password;
    }
    async getUq(uqFullName) {
        let uq = this.uqs[uqFullName];
        if (uq !== undefined)
            return uq;
        return this.uqs[uqFullName] = await this.createUq(uqFullName);
    }
    async createUq(uqFullName) {
        let uq = new uq_1.Uq(this, uqFullName);
        await uq.init(this.userName, this.password);
        this.uqs[uqFullName] = uq;
        return uq;
    }
    async init() {
        this.unitx = new uq_1.UqUnitx(this, $unitx);
        await this.unitx.init(this.userName, this.password);
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