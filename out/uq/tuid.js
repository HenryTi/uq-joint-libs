"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const entity_1 = require("./entity");
const caller_1 = require("./caller");
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
    //isImport = false;
    //abstract get hasDiv():boolean;// {return this.divs!==undefined}
    //abstract div(name:string):TuidDiv;
    //abstract async loadMain(id:number):Promise<any>;
    //abstract async load(id:number):Promise<any>;
    //abstract async all():Promise<any[]>;
    async save(id, props) {
        /*
        let {fields} = this.schema;
        let params:any = {$id: id};
        for (let field of fields as Field[]) {
            let {name, tuid, type} = field;
            let val = props[name];
            if (tuid !== undefined) {
                if (typeof val === 'object') {
                    if (val !== null) val = val.id;
                }
            }
            else {
                switch (type) {
                    case 'date':
                    case 'datetime':
                        val = new Date(val).toISOString();
                        val = (val as string).replace('T', ' ');
                        val = (val as string).replace('Z', '');
                        break;
                }
            }
            params[name] = val;
        }
        let ret = await this.uqApi.tuidSave(this.name, params);
        return ret;
        */
        let ret = new SaveCaller(this, { id: id, props: props }).request();
        /*
        if (id !== undefined) {
            this.idCache.remove(id);
            this.localArr.removeItem(id);
        }
        */
        return ret;
    }
    async all() {
        let ret = await new AllCaller(this, {}).request();
        return ret;
    }
    async search(key, pageStart, pageSize) {
        let ret = await this.searchArr(undefined, key, pageStart, pageSize);
        return ret;
    }
    async searchArr(owner, key, pageStart, pageSize) {
        //let api = this.uqApi;
        //let ret = await api.tuidSearch(this.name, undefined, owner, key, pageStart, pageSize);
        let params = { arr: undefined, owner: owner, key: key, pageStart: pageStart, pageSize: pageSize };
        let ret = await new SearchCaller(this, params).request();
        let { fields } = this.schema;
        //for (let row of ret) {
        //    this.cacheFieldsInValue(row, fields);
        //}
        return ret;
    }
    async loadArr(arr, owner, id) {
        if (id === undefined || id === 0)
            return;
        //let api = this.uqApi;
        //return await api.tuidArrGet(this.name, arr, owner, id);
        return await new LoadArrCaller(this, { arr: arr, owner: owner, id: id }).request();
    }
    async saveArr(arr, owner, id, props) {
        //let params = _.clone(props);
        //params["$id"] = id;
        //return await this.uqApi.tuidArrSave(this.name, arr, owner, params);
        return await new SaveArrCaller(this, { arr: arr, owner: owner, id: id, props: props }).request();
    }
    async posArr(arr, owner, id, order) {
        //return await this.uqApi.tuidArrPos(this.name, arr, owner, id, order);
        return await new ArrPosCaller(this, { arr: arr, owner: owner, id: id, order: order }).request();
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
class TuidCaller extends caller_1.EntityCaller {
    get entity() { return this._entity; }
    ;
}
// 包含main字段的load id
// 当前为了兼容，先调用的包含所有字段的内容
class GetCaller extends TuidCaller {
    constructor() {
        super(...arguments);
        this.method = 'GET';
    }
    get path() { return `tuid/${this.entity.name}/${this.params}`; }
}
class IdsCaller extends TuidCaller {
    get path() {
        let { divName } = this.params;
        return `tuidids/${this.entity.name}/${divName !== undefined ? divName : '$'}`;
    }
    buildParams() { return this.params.ids; }
    xresult(res) {
        return res.split('\n');
    }
}
class SaveCaller extends TuidCaller {
    get path() { return `tuid/${this.entity.name}`; }
    buildParams() {
        let { fields, arrFields } = this.entity;
        let { id, props } = this.params;
        let params = { $id: id };
        this.transParams(params, props, fields);
        if (arrFields !== undefined) {
            for (let arr of arrFields) {
                let arrName = arr.name;
                let arrParams = [];
                let arrFields = arr.fields;
                let arrValues = props[arrName];
                if (arrValues !== undefined) {
                    for (let arrValue of arrValues) {
                        let row = {};
                        this.transParams(row, arrValue, arrFields);
                        arrParams.push(row);
                    }
                }
                params[arrName] = arrParams;
            }
        }
        return params;
    }
    transParams(values, params, fields) {
        if (params === undefined)
            return;
        for (let field of fields) {
            let { name, tuid, type } = field;
            let val = params[name];
            if (tuid !== undefined) {
                if (typeof val === 'object') {
                    if (val !== null)
                        val = val.id;
                }
            }
            else {
                switch (type) {
                    case 'date':
                        val = this.entity.buildDateParam(val);
                        //val = (val as string).replace('T', ' ');
                        //val = (val as string).replace('Z', '');
                        break;
                    case 'datetime':
                        val = this.entity.buildDateTimeParam(val);
                        //val = new Date(val).toISOString();
                        //val = (val as string).replace('T', ' ');
                        //val = (val as string).replace('Z', '');
                        break;
                }
            }
            values[name] = val;
        }
    }
}
class SearchCaller extends TuidCaller {
    get path() { return `tuids/${this.entity.name}`; }
}
class AllCaller extends TuidCaller {
    constructor() {
        super(...arguments);
        this.method = 'GET';
    }
    get path() { return `tuid-all/${this.entity.name}`; }
}
class LoadArrCaller extends TuidCaller {
    constructor() {
        super(...arguments);
        this.method = 'GET';
    }
    get path() {
        let { arr, owner, id } = this.params;
        return `tuid-arr/${this.entity.name}/${owner}/${arr}/${id}`;
    }
}
class SaveArrCaller extends TuidCaller {
    get path() {
        let { arr, owner } = this.params;
        return `tuid-arr/${this.entity.name}/${owner}/${arr}/`;
    }
    buildParams() {
        let { id, props } = this.params;
        let params = lodash_1.default.clone(props);
        params['$id'] = id;
        return params;
    }
}
class ArrPosCaller extends TuidCaller {
    get path() {
        let { arr, owner } = this.params;
        return `tuid-arr-pos/${this.entity.name}/${owner}/${arr}/`;
    }
    buildParams() {
        let { id, order } = this.params;
        return { bid: id, $order: order };
    }
}
//# sourceMappingURL=tuid.js.map