import { Mapper } from "./mapper";
import { execSql } from "../db/mysql/tool";
import { createMapTable } from "./createMapTable";
//import { getOpenApi } from "./openApi";
import { databaseName } from "../db/mysql/database";
import { map } from "./map";
import { UqIn } from "../defines";
import { Joint } from "../joint";

abstract class MapData {
    //protected unit: number;
    //protected uqInDict: { [tuid: string]: UqIn };
    protected joint: Joint;

    //constructor(uqInDict: { [tuid: string]: UqIn }, unit: number) {
    constructor(joint: Joint) {
        //this.uqInDict = uqInDict;
        //this.unit = unit;
        this.joint = joint;
    }
    protected abstract tuidId(tuid: string, value: any): Promise<string | number>;

    async mapOwner(tuidAndArr: string, ownerVal: any): Promise<number> {
        //let pos = owner.indexOf('@');
        //if (pos <= 0) return;
        //let v:string = owner.substr(0, pos);
        //let tuid = owner.substr(pos+1);
        let propId = await this.tuidId(tuidAndArr, ownerVal) as number;
        return propId;
    }

    protected async mapProp(i: string, prop: string, data: any): Promise<any> {
        let pos = prop.indexOf('@');
        if (pos < 0) {
            return data[prop];
        }
        else {
            let v: string;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            let propId = await this.tuidId(tuid, data[v]);
            return propId;
        }
    }

    protected async mapArrProp(i: string, prop: string, row: any, data: any): Promise<any> {
        let p: any;
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
            let v: string;
            if (pos === 0)
                v = i;
            else
                v = prop.substr(0, pos);
            let tuid = prop.substr(pos + 1);
            let propId = await this.tuidId(tuid, p[v]);
            return propId;
        }
    }

    async map(data: any, mapper: Mapper): Promise<any> {
        let body: any = {};
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
                    body[i] = await this.mapArr(data, arr, prop)
                    break;
            }
        }
        return body;
    }

    private async mapArr(data: any, arr: string, mapper: Mapper): Promise<any> {
        let arrRows: any[] = data[arr];
        if (arrRows === undefined) arrRows = [{}];
        let ret: any[] = [];
        if (Array.isArray(arrRows) === false) arrRows = [arrRows];
        for (let row of arrRows) {
            let r: any = {};
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
export class MapToUq extends MapData {
    protected async tuidId(tuid: string, value: any): Promise<string | number> {
        if (value === undefined || value === null) return;

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
        let { entity, uq } = uqIn as UqIn;
        let sql = `select id from \`${databaseName}\`.\`map_${entity.toLowerCase()}\` where no='${value}'`;
        let ret: any[];
        try {
            ret = await execSql(sql);
        }
        catch (err) {
            await createMapTable(entity);
            ret = await execSql(sql);
        }
        if (ret.length === 0) {
            let vId = await this.getTuidVid(uq, entity);
            if (vId !== undefined) {
                if (typeof vId === 'number' && vId > 0) {
                    await map(entity, vId, value);
                }
                return vId;
            } else {
                throw 'entity: ' + entity + ' getTuidVid result: undefined.';
            }
        }
        return ret[0]['id'];
    }

    protected async getTuidVid(uqFullName: string, entity: string) {
        try {
            //let uqApi = await this.joint.getUqApi(uq);
            //let vId = await uqApi.getTuidVId(entity);
            let uq = await this.joint.getUq(uqFullName);
            let vId = await uq.getTuidVId(entity);
            return vId;
        } catch (error) {
            console.error(error);
            if (error.code === 'EITMEOUT')
                return this.getTuidVid(uqFullName, entity);
            else
                throw error;
        }
    }
}

/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，调用getTuidVid生成一个，并写入映射表)
 */
export class MapUserToUq extends MapToUq {
    protected async getTuidVid(uq: string, entity: string) {
        return -1;
    }
}

/**
 * 根据tonva中的id从映射表中获取no
 */
export class MapFromUq extends MapData {
    protected async tuidId(tuid: string, value: any): Promise<string | number> {
        if (value === undefined || value === null) return;

        let uqIn = this.joint.uqInDict[tuid];
        if (typeof uqIn !== 'object')
            throw `tuid ${tuid} is not defined in settings.in`;

        let { entity, uq } = uqIn as UqIn;
        let sql = `select no from \`${databaseName}\`.\`map_${entity.toLowerCase()}\` where id='${value}'`;
        let ret: any[];
        try {
            ret = await execSql(sql);
        } catch (error) {
            await createMapTable(entity);
            ret = await execSql(sql);
        }
        if (ret.length === 0) return 'n/a';
        return ret[0].no;
    }
}
