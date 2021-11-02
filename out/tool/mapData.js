"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapFromUq = exports.MapUserToUq = exports.MapToUq = void 0;
const tool_1 = require("../db/mysql/tool");
const createMapTable_1 = require("./createMapTable");
//import { getOpenApi } from "./openApi";
const database_1 = require("../db/mysql/database");
const map_1 = require("./map");
const defines_1 = require("../defines");
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
    /**
     * 处理mapper设置中string格式的转换
     * string设置有几种格式：
     * 1.普通字符串：
     * 2.fieldName@entityName:
     * @param i mapper中的第i个属性
     * @param prop mapper中属性值（是转换前的data中的属性名）
     * @param data 来源数据对象
     */
    async mapProp(i, prop, data) {
        let pos = prop.indexOf('@');
        if (pos < 0) {
            return this.replaceTabWithBlank(data[prop]);
        }
        else {
            let v;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            // 对于tuid，支持在@TuidName后添加(默认值)，在来源数据未提供时，使用此默认值
            var matched = tuid.match(/(\w+)\(([-\w]+)\)$/);
            if (matched && matched.length === 3) {
                tuid = matched[1];
                if (data[v] === undefined)
                    return matched[2];
            }
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
            return this.replaceTabWithBlank(p[prop]);
        }
        else {
            let v;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            // 对于tuid，支持在@TuidName后添加(默认值)，在来源数据未提供时，使用此默认值
            var matched = tuid.match(/(\w+)\(([-\w]+)\)$/);
            if (matched && matched.length === 3) {
                tuid = matched[1];
                if (data[v] === undefined)
                    return matched[2];
            }
            let propId = await this.tuidId(tuid, p[v]);
            return propId;
        }
    }
    /**
     * 根据Mapper的设置，将来源数据对象转换为目标数据对象
     * 对于 filedName@EntityName格式的设置，会去map表中查找对应的tonva系统Id，未找到的情况，会生成虚拟的tonva系统id，并保存到map表中
     * @param data 来源数据对象
     * @param mapper 转换规则
     * @returns 目标数据对象
     */
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
    replaceTabWithBlank(input) {
        if (input && typeof input === 'string')
            return input.replace(/[\t\n]/g, ' ');
        return input;
    }
    ;
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
        let vid;
        switch (uqIn.type) {
            default:
                throw `${tuid} is not tuid in settings.in`;
            case 'ID':
                vid = async (uqFullName, entity) => await this.getIDNew(uqFullName, entity, value);
                break;
            case 'tuid':
            case 'tuid-arr':
                vid = async (uqFullName, entity) => await this.getTuidVid(uqFullName, entity);
                break;
        }
        let entitySchema = (0, defines_1.getMapName)(uqIn);
        let sql = `select id from \`${database_1.databaseName}\`.\`map_${entitySchema}\` where no='${value}'`;
        let ret;
        try {
            ret = await (0, tool_1.execSql)(sql);
        }
        catch (err) {
            await (0, createMapTable_1.createMapTable)(entitySchema);
            ret = await (0, tool_1.execSql)(sql);
        }
        if (ret.length === 0) {
            let { entity, uq } = uqIn;
            let vId = await vid(uq, entity);
            if (vId !== undefined) {
                if (typeof vId === 'number' && vId > 0) {
                    await (0, map_1.map)(entitySchema, vId, value);
                }
                return vId;
            }
            else {
                throw 'entity: ' + entity + ' getTuidVid result: undefined.';
            }
        }
        return ret[0]['id'];
    }
    async getIDNew(uqFullName, entity, key) {
        let uq = await this.joint.getUq(uqFullName);
        try {
            let vId = await uq.getIDNew(entity, key);
            return vId;
        }
        catch (error) {
            console.error(error);
            if (error.code === 'EITMEOUT')
                return uq.getIDNew(entity, key);
            else
                throw error;
        }
    }
    async getTuidVid(uqFullName, entity) {
        try {
            let uq = await this.joint.getUq(uqFullName);
            let vId = await uq.getTuidVId(entity);
            return vId;
        }
        catch (error) {
            console.error(error);
            if (error.code === 'EITMEOUT')
                return this.getTuidVid(uqFullName, entity);
            else
                throw error;
        }
    }
}
exports.MapToUq = MapToUq;
/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，采用不生成虚拟id的策略，目前仅用于webuser中的webuser表）
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
        let entitySchema = (0, defines_1.getMapName)(uqIn);
        let sql = `select no from \`${database_1.databaseName}\`.\`map_${entitySchema}\` where id='${value}'`;
        let ret;
        try {
            ret = await (0, tool_1.execSql)(sql);
        }
        catch (error) {
            await (0, createMapTable_1.createMapTable)(entitySchema);
            ret = await (0, tool_1.execSql)(sql);
        }
        if (ret.length === 0)
            return 'n/a';
        return ret[0].no;
    }
}
exports.MapFromUq = MapFromUq;
//# sourceMappingURL=mapData.js.map