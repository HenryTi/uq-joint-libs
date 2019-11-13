"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tool_1 = require("../db/mysql/tool");
const createMapTable_1 = require("./createMapTable");
//import { getOpenApi } from "./openApi";
const database_1 = require("../db/mysql/database");
const map_1 = require("./map");
class MapData {
    //constructor(uqInDict: { [tuid: string]: UqIn }, unit: number) {
    constructor(joint) {
        //this.uqInDict = uqInDict;
        //this.unit = unit;
        this.joint = joint;
    }
    async mapOwner(tuidAndArr, ownerVal) {
        //let pos = owner.indexOf('@');
        //if (pos <= 0) return;
        //let v:string = owner.substr(0, pos);
        //let tuid = owner.substr(pos+1);
        let propId = await this.tuidId(tuidAndArr, ownerVal);
        return propId;
    }
    async mapProp(i, prop, data) {
        let pos = prop.indexOf('@');
        if (pos < 0) {
            return data[prop];
        }
        else {
            let v;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            let propId = await this.tuidId(tuid, data[v]);
            return propId;
        }
    }
    async mapArrProp(i, prop, row, data) {
        let p;
        if (prop.startsWith('^')) {
            prop = prop.substr(1);
            p = data;
        }
        else {
            p = row;
        }
        let pos = prop.indexOf('@');
        if (pos < 0) {
            return p[prop];
        }
        else {
            let v;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            let propId = await this.tuidId(tuid, p[v]);
            return propId;
        }
    }
    async map(data, mapper) {
        let body = {};
        for (let i in mapper) {
            let prop = mapper[i];
            //let value = data[i];
            switch (typeof prop) {
                case 'undefined':
                    break;
                case 'boolean':
                    if (prop === true) {
                        body[i] = data[i];
                    }
                    else {
                    }
                    break;
                case 'number':
                    body[i] = prop;
                    break;
                case 'string':
                    let val = await this.mapProp(i, prop, data);
                    body[i] = val;
                    break;
                case 'object':
                    let arr = prop.$name || i;
                    body[i] = await this.mapArr(data, arr, prop);
                    break;
            }
        }
        return body;
    }
    async mapArr(data, arr, mapper) {
        let arrRows = data[arr];
        if (arrRows === undefined)
            arrRows = [{}];
        let ret = [];
        if (Array.isArray(arrRows) === false)
            arrRows = [arrRows];
        for (let row of arrRows) {
            let r = {};
            for (let i in mapper) {
                let prop = mapper[i];
                switch (typeof prop) {
                    case 'undefined':
                        break;
                    case 'boolean':
                        if (prop === true) {
                            r[i] = row[i];
                        }
                        else {
                        }
                        break;
                    case 'number':
                        r[i] = prop;
                        break;
                    case 'string':
                        let val = await this.mapArrProp(i, prop, row, data);
                        r[i] = val;
                        break;
                    case 'object':
                        break;
                }
            }
            ret.push(r);
        }
        return ret;
    }
}
/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，调用getTuidVid生成一个，并写入映射表)
 */
class MapToUq extends MapData {
    async tuidId(tuid, value) {
        if (value === undefined || value === null)
            return;
        let uqIn = this.joint.uqInDict[tuid];
        if (typeof uqIn !== 'object') {
            throw `tuid ${tuid} is not defined in settings.in`;
        }
        switch (uqIn.type) {
            default:
                throw `${tuid} is not tuid in settings.in`;
            case 'tuid':
            case 'tuid-arr':
                break;
        }
        let { entity, uq } = uqIn;
        let sql = `select id from \`${database_1.databaseName}\`.\`map_${entity.toLowerCase()}\` where no='${value}'`;
        let ret;
        try {
            ret = await tool_1.execSql(sql);
        }
        catch (err) {
            await createMapTable_1.createMapTable(entity);
            ret = await tool_1.execSql(sql);
        }
        if (ret.length === 0) {
            let vId = await this.getTuidVid(uq, entity);
            if (vId !== undefined) {
                if (typeof vId === 'number' && vId > 0) {
                    await map_1.map(entity, vId, value);
                }
                return vId;
            }
            else {
                throw 'entity: ' + entity + ' getTuidVid result: undefined.';
            }
        }
        return ret[0]['id'];
    }
    async getTuidVid(uq, entity) {
        try {
            let uqApi = await this.joint.getUqApi(uq);
            let vId = await uqApi.getTuidVId(entity);
            return vId;
        }
        catch (error) {
            console.error(error);
            if (error.code === 'EITMEOUT')
                return this.getTuidVid(uq, entity);
            else
                throw error;
        }
    }
}
exports.MapToUq = MapToUq;
/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，调用getTuidVid生成一个，并写入映射表)
 */
class MapUserToUq extends MapToUq {
    async getTuidVid(uq, entity) {
        return -1;
    }
}
exports.MapUserToUq = MapUserToUq;
/**
 * 根据tonva中的id从映射表中获取no
 */
class MapFromUq extends MapData {
    async tuidId(tuid, value) {
        if (value === undefined || value === null)
            return;
        let uqIn = this.joint.uqInDict[tuid];
        if (typeof uqIn !== 'object')
            throw `tuid ${tuid} is not defined in settings.in`;
        let { entity, uq } = uqIn;
        let sql = `select no from \`${database_1.databaseName}\`.\`map_${entity.toLowerCase()}\` where id='${value}'`;
        let ret;
        try {
            ret = await tool_1.execSql(sql);
        }
        catch (error) {
            await createMapTable_1.createMapTable(entity);
            ret = await tool_1.execSql(sql);
        }
        if (ret.length === 0)
            return 'n/a';
        return ret[0].no;
    }
}
exports.MapFromUq = MapFromUq;
//# sourceMappingURL=mapData.js.map