"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqUnitxTest = exports.UqUnitxProd = exports.Unitx = void 0;
const centerApi_1 = require("../tool/centerApi");
const fetch_1 = require("../tool/fetch");
class UnitxApi extends fetch_1.Fetch {
    constructor(unit, url) {
        super(url);
        this.unit = unit;
    }
    async readBus(face, queue, defer) {
        let ret = await this.post('joint-read-bus', {
            unit: this.unit,
            face,
            queue,
            defer,
        });
        return ret;
    }
    async writeBus(face, from, queue, busVersion, body, defer, stamp) {
        let ret = await this.post('joint-write-bus', {
            unit: this.unit,
            face: face,
            from: from,
            fromQueueId: queue,
            version: busVersion,
            body,
            defer,
            stamp
        });
        return ret;
    }
}
class Unitx /*extends Uq*/ {
    constructor(unit) {
        this.unit = unit;
    }
    /**
     * 初始化this.currentCreateTick / this.prevUnitxApi / this.currentUnitxApi(这3个是干什么的？)
     */
    async init() {
        let unitxUrls = await centerApi_1.centerApi.unitUnitx(this.unit);
        let { tv, current } = this.toTvCurrent(unitxUrls);
        let prevUnitxUrlServer, currentUnitxUrlServer;
        if (current !== undefined) {
            prevUnitxUrlServer = tv;
            currentUnitxUrlServer = current;
        }
        else {
            prevUnitxUrlServer = undefined;
            currentUnitxUrlServer = tv;
        }
        this.currentCreateTick = currentUnitxUrlServer.create;
        console.log('unitx prev', prevUnitxUrlServer);
        console.log('unitx current', currentUnitxUrlServer);
        this.prevUnitxApi = await this.createUnitxApi(prevUnitxUrlServer);
        this.currentUnitxApi = await this.createUnitxApi(currentUnitxUrlServer);
    }
    async createUnitxApi(unitxUrlServer) {
        if (unitxUrlServer === undefined)
            return undefined;
        let { url } = unitxUrlServer;
        let unitxUrl = this.unitxUrl(url);
        return new UnitxApi(this.unit, unitxUrl);
    }
    async readBus(face, queue, defer) {
        let unitxApi;
        if (this.prevUnitxApi === undefined) {
            unitxApi = this.currentUnitxApi;
        }
        else {
            let delta = Date.now() / 1000 - this.currentCreateTick;
            let minutes = delta / 60;
            unitxApi = minutes < 10 ? this.prevUnitxApi : this.currentUnitxApi;
        }
        return await unitxApi.readBus(face, queue, defer);
    }
    async writeBus(face, source, newQueue, busVersion, body, defer, stamp) {
        await this.currentUnitxApi.writeBus(face, source, newQueue, busVersion, body, defer, stamp);
    }
}
exports.Unitx = Unitx;
class UqUnitxProd extends Unitx {
    toTvCurrent(unitxUrls) {
        let { tv, prod: current } = unitxUrls;
        return { tv, current };
    }
    unitxUrl(url) { return url + 'uq/unitx-prod/'; }
    ;
}
exports.UqUnitxProd = UqUnitxProd;
class UqUnitxTest extends Unitx {
    toTvCurrent(unitxUrls) {
        let { tv, test: current } = unitxUrls;
        return { tv, current };
    }
    unitxUrl(url) { return url + 'uq/unitx-test/'; }
    ;
}
exports.UqUnitxTest = UqUnitxTest;
//# sourceMappingURL=unitx.js.map