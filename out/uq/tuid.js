"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entity_1 = require("./entity");
const maxCacheSize = 1000;
class Cache {
    constructor() {
        this.values = {};
        this.queue = [];
    }
    getValue(id) {
        let ret = this.values[id];
        if (ret === undefined)
            return;
        this.moveToHead(id);
        return ret;
    }
    setValue(id, value) {
        if (this.queue.length >= maxCacheSize) {
            let removeId = this.queue.shift();
            delete this.values[removeId];
        }
        if (this.values[id] !== undefined) {
            this.moveToHead(id);
        }
        else {
            this.queue.push(id);
        }
        this.values[id] = value;
    }
    moveToHead(id) {
        let index = this.queue.findIndex(v => v === id);
        this.queue.splice(index, 1);
        this.queue.push(id);
    }
}
class Tuid extends entity_1.Entity {
    constructor() {
        super(...arguments);
        this.cache = new Cache;
        this.cacheAllProps = new Cache;
    }
    get typeName() { return 'tuid'; }
    getIdFromObj(obj) { return obj.id; }
    /*
    async getApiFrom() {
        if (this.from === undefined) return this.uq.openApi;
        if (this.fromUq === undefined) {
            let {owner, uq:uqName} = this.from;
            this.fromUq = await this.uq.getFromUq(owner+'/'+uqName);
        }
        return this.fromUq.openApi;
    }
    */
    setSchema(schema) {
        super.setSchema(schema);
        this.from = schema.from;
    }
    async getTuidFrom() {
        if (this.from === undefined)
            return this;
        if (this.fromUq === undefined) {
            let { owner, uq: uqName } = this.from;
            this.fromUq = await this.uq.getFromUq(owner + '/' + uqName);
        }
        return this.fromUq.getTuidFromName(this.name);
    }
    async loadValue(id, ownerId, allProps) {
        let ret;
        if (allProps === true) {
            ret = this.cacheAllProps.getValue(id);
        }
        else {
            ret = this.cache.getValue(id);
        }
        if (ret !== undefined)
            return ret;
        //let openApi = await this.getApiFrom();
        let tuidValue = await this.internalLoadTuidValue(this.uq, id, ownerId, allProps);
        if (tuidValue.length > 0)
            ret = tuidValue[0];
        else
            ret = undefined;
        if (allProps === true)
            this.cacheAllProps.setValue(id, ret);
        else
            this.cache.setValue(id, ret);
        return ret;
    }
}
exports.Tuid = Tuid;
class TuidMain extends Tuid {
    get Main() { return this; }
    setSchema(schema) {
        super.setSchema(schema);
        let { arrs } = schema;
        if (arrs !== undefined) {
            this.divs = {};
            for (let arr of arrs) {
                let { name } = arr;
                let tuidDiv = new TuidDiv(this.uq, name, this.typeId);
                tuidDiv.owner = this;
                this.divs[name] = tuidDiv;
                tuidDiv.setSchema(arr);
            }
        }
    }
    async internalLoadTuidValue(uq, id, ownerId, allProps) {
        return uq.loadTuidMainValue(this.name, id, allProps);
    }
}
exports.TuidMain = TuidMain;
class TuidDiv extends Tuid {
    get Main() { return this.owner; }
    async getTuidFrom() {
        let ownerFrom = await this.owner.getTuidFrom();
        if (ownerFrom === this.owner)
            return this;
        return ownerFrom.divs[this.name];
        /*
                if (this.fromUq === undefined) {
                    let {owner, uq:uqName} = this.from;
                    this.fromUq = await this.uq.getFromUq(owner+'/'+uqName);
                }
                return this.fromUq.getTuidFromName(this.name);
        */
    }
    /*
    async getApiFrom() {
        return await this.owner.getApiFrom();
    }
    */
    async internalLoadTuidValue(uq, id, ownerId, allProps) {
        return await uq.loadTuidDivValue(this.owner.name, this.name, id, ownerId, allProps);
    }
}
exports.TuidDiv = TuidDiv;
//# sourceMappingURL=tuid.js.map