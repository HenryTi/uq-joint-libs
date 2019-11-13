"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tuid_1 = require("./tuid");
const uqApi_1 = require("../tool/uqApi");
const centerApi_1 = require("../tool/centerApi");
const host_1 = require("../tool/host");
class Uq {
    constructor(uqs, uqFullName) {
        this.tuids = {};
        this.tuidArr = [];
        this.uqs = uqs;
        this.uqFullName = uqFullName;
    }
    async init() {
        await this.initUqApi();
        await this.loadEntities();
    }
    async buildData(data, props) {
        if (data === undefined)
            return;
        let ret = {};
        let names = [];
        let promises = [];
        for (let i in data) {
            let v = data[i];
            if (v === undefined)
                continue;
            let prop = props[i];
            if (prop === undefined) {
                ret[i] = v;
                continue;
            }
            let { uq: uqFullName, tuid: tuidName, tuidOwnerProp } = prop;
            let tuid = await this.getTuidFromUq(uqFullName, tuidName);
            if (tuid === undefined)
                continue;
            names.push(i);
            let ownerId = tuidOwnerProp && data[tuidOwnerProp];
            promises.push(this.buildTuidValue(tuid, prop, v, ownerId));
        }
        let len = names.length;
        if (len > 0) {
            let values = await Promise.all(promises);
            for (let i = 0; i < len; i++) {
                ret[names[i]] = values[i];
            }
        }
        return ret;
    }
    async buildTuidValue(tuid, prop, id, ownerId) {
        let tuidFrom = await tuid.getTuidFrom();
        let all;
        let props;
        if (prop === undefined) {
            all = false;
        }
        else {
            all = prop.all;
            props = prop.props;
        }
        let ret = await tuidFrom.loadValue(id, ownerId, all);
        if (props === undefined)
            return ret;
        let names = [];
        let promises = [];
        for (let f of tuidFrom.fields) {
            let { _tuid, _ownerField } = f;
            if (_tuid === undefined)
                continue;
            let { name } = f;
            //if (name === 'address') debugger;
            let prp = props[name];
            if (prp === undefined)
                continue;
            let v = ret[name];
            if (v === undefined)
                continue;
            let vType = typeof v;
            if (vType === 'object')
                continue;
            let p;
            if (typeof prp === 'boolean')
                p = undefined;
            else
                p = prp;
            names.push(name);
            let ownerId = _ownerField && ret[_ownerField.name];
            promises.push(this.buildTuidValue(_tuid, p, v, ownerId));
        }
        let len = names.length;
        if (len > 0) {
            let values = await Promise.all(promises);
            for (let i = 0; i < len; i++) {
                ret[names[i]] = values[i];
            }
        }
        return ret;
    }
    async getFromUq(uqFullName) {
        let uq = await this.uqs.getUq(uqFullName);
        return uq;
    }
    async getTuidFromUq(uqFullName, tuidName) {
        tuidName = tuidName.toLowerCase();
        if (uqFullName === undefined)
            return this.getTuidFromName(tuidName);
        let uq = await this.uqs.getUq(uqFullName);
        if (uq === undefined)
            return;
        let tuid = uq.getTuidFromName(tuidName);
        if (tuid.from !== undefined) {
            let { owner, uq: uqName } = tuid.from;
            let fromUq = await this.uqs.getUq(owner + '/' + uqName);
            if (fromUq === undefined)
                return;
            tuid = fromUq.getTuidFromName(tuidName);
        }
        return tuid;
    }
    getTuidFromName(tuidName) {
        let parts = tuidName.split('.');
        return this.getTuid(parts[0], parts[1]);
    }
    async schema(entityName) {
        return await this.uqApi.schema(entityName);
    }
    async saveTuid(tuid, body) {
        return await this.uqApi.saveTuid(tuid, body);
    }
    async saveTuidArr(tuid, tuidArr, ownerId, body) {
        return await this.uqApi.saveTuidArr(tuid, tuidArr, ownerId, body);
    }
    async getTuidVId(ownerEntity) {
        return await this.uqApi.getTuidVId(ownerEntity);
    }
    async loadTuidMainValue(tuidName, id, allProps) {
        return await this.uqApi.loadTuidMainValue(tuidName, id, allProps);
    }
    async loadTuidDivValue(tuidName, divName, id, ownerId, allProps) {
        return await this.uqApi.loadTuidDivValue(tuidName, divName, id, ownerId, allProps);
    }
    async setMap(map, body) {
        await this.uqApi.setMap(map, body);
    }
    async delMap(map, body) {
        await this.uqApi.delMap(map, body);
    }
    async initUqApi() {
        let { unit } = this.uqs;
        let uqUrl = await centerApi_1.centerApi.urlFromUq(unit, this.uqFullName);
        let { db, url, urlTest } = uqUrl;
        let realUrl = host_1.host.getUrlOrTest(db, url, urlTest);
        this.uqApi = new uqApi_1.UqApi(realUrl, unit);
    }
    buildTuids(tuids) {
        for (let i in tuids) {
            let schema = tuids[i];
            let { name, typeId } = schema;
            let tuid = this.newTuid(i, typeId);
            tuid.sys = true;
        }
        for (let i in tuids) {
            let schema = tuids[i];
            let { name } = schema;
            let tuid = this.getTuid(i);
            //tuid.sys = true;
            tuid.setSchema(schema);
        }
    }
    buildAccess(access) {
        for (let a in access) {
            let v = access[a];
            switch (typeof v) {
                case 'string':
                    this.fromType(a, v);
                    break;
                case 'object':
                    this.fromObj(a, v);
                    break;
            }
        }
    }
    fromType(name, type) {
        let parts = type.split('|');
        type = parts[0];
        let id = Number(parts[1]);
        switch (type) {
            case 'uq':
                this.id = id;
                break;
            case 'tuid':
                let tuid = this.newTuid(name, id);
                tuid.sys = false;
                break;
            /*
            case 'action': this.newAction(name, id); break;
            case 'query': this.newQuery(name, id); break;
            case 'book': this.newBook(name, id); break;
            case 'map': this.newMap(name, id); break;
            case 'history': this.newHistory(name, id); break;
            case 'sheet':this.newSheet(name, id); break;
            case 'pending': this.newPending(name, id); break;
            */
        }
    }
    fromObj(name, obj) {
        switch (obj['$']) {
            //case 'sheet': this.buildSheet(name, obj); break;
        }
    }
    async loadEntities() {
        let entities = await this.uqApi.loadEntities();
        this.buildEntities(entities);
    }
    buildEntities(entities) {
        let { access, tuids } = entities;
        this.buildTuids(tuids);
        this.buildAccess(access);
    }
    getTuid(name, div, tuidUrl) {
        let tuid = this.tuids[name];
        if (tuid === undefined)
            return;
        if (div === undefined)
            return tuid;
        return tuid.divs[div];
    }
    newTuid(name, entityId) {
        let tuid = this.tuids[name];
        if (tuid !== undefined)
            return tuid;
        tuid = this.tuids[name] = new tuid_1.TuidMain(this, name, entityId);
        this.tuidArr.push(tuid);
        return tuid;
    }
    buildFieldTuid(fields, mainFields) {
        if (fields === undefined)
            return;
        for (let f of fields) {
            let { tuid, arr, url } = f;
            if (tuid === undefined)
                continue;
            f._tuid = this.getTuid(tuid, arr, url);
        }
        for (let f of fields) {
            let { owner } = f;
            if (owner === undefined)
                continue;
            let ownerField = fields.find(v => v.name === owner);
            if (ownerField === undefined) {
                if (mainFields !== undefined) {
                    ownerField = mainFields.find(v => v.name === owner);
                }
                if (ownerField === undefined) {
                    throw `owner field ${owner} is undefined`;
                }
            }
            f._ownerField = ownerField;
            let { arr, url } = f;
            f._tuid = this.getTuid(ownerField._tuid.name, arr, url);
            if (f._tuid === undefined)
                throw 'owner field ${owner} is not tuid';
        }
    }
    buildArrFieldsTuid(arrFields, mainFields) {
        if (arrFields === undefined)
            return;
        for (let af of arrFields) {
            let { fields } = af;
            if (fields === undefined)
                continue;
            this.buildFieldTuid(fields, mainFields);
        }
    }
}
exports.Uq = Uq;
class UqUnitx extends Uq {
    async readBus(face, queue) {
        return await this.uqApi.readBus(face, queue);
    }
    async writeBus(face, source, newQueue, busVersion, body) {
        await this.uqApi.writeBus(face, source, newQueue, busVersion, body);
    }
    async loadEntities() {
    }
}
exports.UqUnitx = UqUnitx;
//# sourceMappingURL=uq.js.map