"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqsTest = exports.UqsProd = exports.Uqs = void 0;
//import { Unitx, UqUnitxProd, UqUnitxTest } from './unitx';
const uq_1 = require("./uq");
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
        let uq = this.newUq(uqFullName);
        await uq.init(this.userName, this.password);
        this.uqs[uqFullName] = uq;
        return uq;
    }
}
exports.Uqs = Uqs;
class UqsProd extends Uqs {
    newUq(uqFullName) { return new uq_1.UqProd(this, uqFullName); }
}
exports.UqsProd = UqsProd;
class UqsTest extends Uqs {
    newUq(uqFullName) { return new uq_1.UqTest(this, uqFullName); }
}
exports.UqsTest = UqsTest;
//# sourceMappingURL=uqs.js.map