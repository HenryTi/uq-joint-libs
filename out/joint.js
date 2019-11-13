"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("log4js");
const tool_1 = require("./db/mysql/tool");
const mapData_1 = require("./tool/mapData");
const map_1 = require("./tool/map");
const router_1 = require("./router");
const database_1 = require("./db/mysql/database");
const createMapTable_1 = require("./tool/createMapTable");
const faceSchemas_1 = require("./tool/faceSchemas");
const uqs_1 = require("./uq/uqs");
const centerApi_1 = require("./tool/centerApi");
const host_1 = require("./tool/host");
//import { faceUser } from "../settings/bus/webUserBus";
const logger = log4js_1.getLogger('joint');
/*
const uqInEntities = config.get<{ name: string, intervalUnit: number }[]>("afterFirstEntities");
const uqBusSettings = config.get<string[]>("uqBus");
*/
//const interval = config.get<number>("interval");
class Joint {
    constructor(settings) {
        this.tickCount = -1;
        this.uqInDict = {};
        this.tick = async () => {
            try {
                this.tickCount++;
                console.log('tick: ' + new Date().toLocaleString() + "; tickCount: " + this.tickCount);
                //await this.scanPull();
                await this.scanIn();
                // await this.scanOut();
                await this.scanBus();
            }
            catch (err) {
                logger.error('error in timer tick');
                logger.error(err);
            }
            finally {
                setTimeout(this.tick, this.scanInterval);
            }
        };
        this.settings = settings;
        let { unit, uqIns: allUqIns, scanInterval } = settings;
        this.unit = unit;
        this.scanInterval = scanInterval || 3000;
        if (allUqIns === undefined)
            return;
        this.uqs = new uqs_1.Uqs(unit);
        for (let uqIn of allUqIns) {
            let { entity, type } = uqIn;
            if (this.uqInDict[entity] !== undefined)
                throw 'can not have multiple ' + entity;
            this.uqInDict[entity] = uqIn;
        }
    }
    createRouter() {
        return router_1.createRouter(this.settings);
    }
    async getUqApi(uqFullName) {
        let uq = await this.uqs.getUq(uqFullName);
        return uq.uqApi;
    }
    async init() {
        await host_1.host.start();
        centerApi_1.centerApi.initBaseUrl(host_1.host.centerUrl);
        await this.uqs.init();
    }
    async start() {
        await this.init();
        setTimeout(this.tick, this.scanInterval);
    }
    /*
    private uqOpenApis: { [uqFullName: string]: { [unit: number]: UqApi } } = {};
    //async getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
    async getOpenApi(uq: string): Promise<UqApi> {
        let openApis = this.uqOpenApis[uq];
        if (openApis === null) return null;
        if (openApis === undefined) {
            this.uqOpenApis[uq] = openApis = {};
        }
        let uqUrl = await centerApi.urlFromUq(this.unit, uq);
        if (uqUrl === undefined) return openApis[this.unit] = null;
        //let {url, urlDebug} = uqUrl;
        //url = await host.getUrlOrDebug(url, urlDebug);
        let { db, url, urlTest } = uqUrl;
        let realUrl = host.getUrlOrTest(db, url, urlTest)
        return openApis[this.unit] = new UqApi(realUrl, this.unit);
    }
    */
    /*
    private async scanPull() {
        for (let i in this.settings.pull) {
            console.log('scan pull ', i);
            let pull = this.settings.pull[i];
            for (;;) {
                let retp = await tableFromProc('read_queue_in_p', [i]);
                let queue:number;
                if (!retp || retp.length === 0) {
                    queue = 0;
                }
                else {
                    queue = retp[0].queue;
                }
                let newQueue = await pull(this, queue);
                if (newQueue === undefined) break;
                await execProc('write_queue_in_p', [i, newQueue]);
            }
        }
    }
    */
    /**
     * 从外部系统同步数据到Tonva
     */
    async scanIn() {
        let { pullReadFromSql, uqInEntities } = this.settings;
        if (uqInEntities === undefined)
            return;
        for (let uqInName of uqInEntities) {
            let uqIn = this.uqInDict[uqInName.name];
            if (uqIn === undefined)
                continue;
            let { uq, type, entity, pull, pullWrite } = uqIn;
            if (this.tickCount % (uqInName.intervalUnit || 1) !== 0)
                continue;
            let queueName = uq + ':' + entity;
            console.log('scan in ' + queueName + ' at ' + new Date().toLocaleString());
            let promises = [];
            for (;;) {
                let message;
                let queue;
                let ret = undefined;
                if (pull !== undefined) {
                    let retp = await tool_1.tableFromProc('read_queue_in_p', [queueName]);
                    if (retp.length > 0) {
                        queue = retp[0].queue;
                    }
                    else {
                        queue = '0';
                    }
                    switch (typeof pull) {
                        case 'function':
                            ret = await pull(this, uqIn, queue);
                            break;
                        case 'string':
                            if (pullReadFromSql === undefined) {
                                let err = 'pullReadFromSql should be defined in settings!';
                                throw err;
                            }
                            ret = await pullReadFromSql(pull, queue);
                            break;
                    }
                    if (ret === undefined)
                        break;
                    // queue = ret.queue;
                    // message = ret.data;
                }
                else {
                    let retp = await tool_1.tableFromProc('read_queue_in', [queueName]);
                    if (!retp || retp.length === 0)
                        break;
                    let { id, body, date } = retp[0];
                    ret = { lastPointer: id, data: [JSON.parse(body)] };
                    // queue = id;
                    // message = JSON.parse(body);
                }
                let { lastPointer, data } = ret;
                // data.sort((a, b) => { return a.ID - b.ID });
                let dataCopy = [];
                for (let i = data.length - 1; i >= 0; i--) {
                    let message = data[i];
                    if (type === "tuid" || type === "tuid-arr") {
                        let no = message[uqIn.key];
                        if (dataCopy.lastIndexOf(no) >= 0)
                            continue;
                        dataCopy.push(no);
                    }
                    if (pullWrite !== undefined)
                        promises.push(pullWrite(this, message));
                    else
                        promises.push(this.uqIn(uqIn, message));
                }
                /*
                data.forEach(message => {
                    if (pullWrite !== undefined) {
                        promises.push(pullWrite(this, message));
                    }
                    else {
                        promises.push(this.uqIn(uqIn, message));
                    }
                });
                */
                try {
                    await Promise.all(promises);
                    promises.splice(0);
                    await tool_1.execProc('write_queue_in_p', [queueName, lastPointer]);
                }
                catch (error) {
                    logger.error(error);
                    break;
                }
            }
        }
    }
    async uqIn(uqIn, data) {
        switch (uqIn.type) {
            case 'tuid':
                await this.uqInTuid(uqIn, data);
                break;
            case 'tuid-arr':
                await this.uqInTuidArr(uqIn, data);
                break;
            case 'map':
                await this.uqInMap(uqIn, data);
                break;
        }
    }
    async uqInTuid(uqIn, data) {
        let { key, mapper, uq: uqFullName, entity: tuid } = uqIn;
        if (key === undefined)
            throw 'key is not defined';
        if (uqFullName === undefined)
            throw 'tuid ' + tuid + ' not defined';
        let keyVal = data[key];
        let mapToUq = new mapData_1.MapToUq(this);
        let body = await mapToUq.map(data, mapper);
        let uq = await this.uqs.getUq(uqFullName);
        try {
            let ret = await uq.saveTuid(tuid, body);
            let { id, inId } = ret;
            if (id) {
                if (id < 0)
                    id = -id;
                await map_1.map(tuid, id, keyVal);
                return id;
            }
            else {
                logger.error('save ' + uqFullName + ':' + tuid + ' no ' + keyVal + ' failed.');
                logger.error(body);
            }
        }
        catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInTuid(uqIn, data);
            }
            else {
                logger.error(uqFullName + ':' + tuid);
                logger.error(body);
                throw error;
            }
        }
    }
    async uqInTuidArr(uqIn, data) {
        let { key, owner, mapper, uq: uqFullName, entity } = uqIn;
        if (key === undefined)
            throw 'key is not defined';
        if (uqFullName === undefined)
            throw 'uq ' + uqFullName + ' not defined';
        if (entity === undefined)
            throw 'tuid ' + entity + ' not defined';
        let parts = entity.split('_');
        let tuidOwner = parts[0];
        if (parts.length === 1)
            throw 'tuid ' + entity + ' must has .arr';
        let tuidArr = parts[1];
        let keyVal = data[key];
        if (owner === undefined)
            throw 'owner is not defined';
        let ownerVal = data[owner];
        try {
            let mapToUq = new mapData_1.MapToUq(this);
            let ownerId = await this.mapOwner(uqIn, tuidOwner, ownerVal);
            if (ownerId === undefined)
                throw 'owner value is undefined';
            let body = await mapToUq.map(data, mapper);
            let uq = await this.uqs.getUq(uqFullName);
            let ret = await uq.saveTuidArr(tuidOwner, tuidArr, ownerId, body);
            let { id, inId } = ret;
            if (id === undefined)
                id = inId;
            else if (id < 0)
                id = -id;
            if (id) {
                await map_1.map(entity, id, keyVal);
                return id;
            }
            else {
                logger.error('save tuid arr ' + uqFullName + ':' + entity + ' no: ' + keyVal + ' failed.');
                logger.error(body);
            }
        }
        catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInTuidArr(uqIn, data);
            }
            else {
                logger.error('save tuid arr ' + uqFullName + ':' + entity + ' no: ' + keyVal + ' failed.');
                throw error;
            }
        }
    }
    /**
     * 在tuidDiv中，根据其owner的no获取id，若owner尚未生成id，则生成之
     * @param uqIn
     * @param ownerEntity
     * @param ownerVal
     */
    async mapOwner(uqIn, ownerEntity, ownerVal) {
        let { uq: uqFullName } = uqIn;
        let sql = `select id from \`${database_1.databaseName}\`.\`map_${ownerEntity.toLowerCase()}\` where no='${ownerVal}'`;
        let ret;
        try {
            ret = await tool_1.execSql(sql);
        }
        catch (err) {
            await createMapTable_1.createMapTable(ownerEntity);
            ret = await tool_1.execSql(sql);
        }
        if (ret.length === 0) {
            try {
                let uq = await this.uqs.getUq(uqFullName);
                let vId = await uq.getTuidVId(ownerEntity);
                await map_1.map(ownerEntity, vId, ownerVal);
                return vId;
            }
            catch (error) {
                if (error.code === "ETIMEDOUT") {
                    logger.error(error);
                    this.mapOwner(uqIn, ownerEntity, ownerVal);
                }
                else {
                    throw error;
                }
            }
        }
        return ret[0]['id'];
    }
    async uqInMap(uqIn, data) {
        let { mapper, uq: uqFullName, entity } = uqIn;
        let mapToUq = new mapData_1.MapToUq(this);
        let body = await mapToUq.map(data, mapper);
        try {
            let uq = await this.uqs.getUq(uqFullName);
            let { $ } = data;
            if ($ === '-')
                await uq.delMap(entity, body);
            else
                await uq.setMap(entity, body);
        }
        catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInMap(uqIn, data);
            }
            else {
                throw error;
            }
        }
    }
    /**
     *
     */
    async scanOut() {
        let { uqOuts } = this.settings;
        if (uqOuts === undefined)
            return;
        for (let uqOut of uqOuts) {
            let { uq, entity } = uqOut;
            let queueName = uq + ':' + entity;
            console.log('scan out ' + queueName);
            for (;;) {
                let queue;
                let retp = await tool_1.tableFromProc('read_queue_out_p', [queueName]);
                if (retp.length === 0)
                    queue = 0;
                else
                    queue = retp[0].queue;
                let ret;
                ret = await this.uqOut(uqOut, queue);
                if (ret === undefined)
                    break;
                let { queue: newQueue, data } = ret;
                await tool_1.execProc('write_queue_out_p', [queueName, newQueue]);
            }
        }
    }
    async uqOut(uqOut, queue) {
        let ret;
        let { type } = uqOut;
        switch (type) {
            //case 'bus': ret = await this.uqOutBus(uqOut as UqOutBus, queue); break;
        }
        return ret;
    }
    /**
     * 通过bus做双向数据同步（bus out和bus in)
     */
    async scanBus() {
        let { name: joinName, bus, uqBusSettings } = this.settings;
        if (bus === undefined)
            return;
        if (uqBusSettings === undefined)
            return;
        let monikerPrefix = '$bus/';
        for (let uqBusName of uqBusSettings) {
            let uqBus = bus[uqBusName];
            let { face, from: busFrom, mapper, push, pull, uqIdProps } = uqBus;
            // bus out(从bus中读取消息，发送到外部系统)
            let moniker = monikerPrefix + face;
            for (;;) {
                if (push === undefined)
                    break;
                console.log('scan bus out ' + uqBusName + ' at ' + new Date().toLocaleString());
                let queue;
                let retp = await tool_1.tableFromProc('read_queue_out_p', [moniker]);
                if (retp.length > 0) {
                    queue = retp[0].queue;
                }
                else {
                    // queue = 430000000000000;
                    queue = 0;
                }
                let newQueue, json;
                if (busFrom === 'center') {
                    let message = await this.userOut(face, queue);
                    if (message === null) {
                        newQueue = queue + 1;
                        await tool_1.execProc('write_queue_out_p', [moniker, newQueue]);
                        break;
                    }
                    if (message === undefined || message['$queue'] === undefined)
                        break;
                    newQueue = message['$queue'];
                    json = message;
                }
                else {
                    let message = await this.uqs.readBus(face, queue);
                    if (message === undefined)
                        break;
                    let { id, from, body } = message;
                    newQueue = id;
                    json = await faceSchemas_1.faceSchemas.unpackBusData(face, body);
                    if (uqIdProps !== undefined && from !== undefined) {
                        let uq = await this.uqs.getUq(from);
                        if (uq !== undefined) {
                            try {
                                let newJson = await uq.buildData(json, uqIdProps);
                                json = newJson;
                            }
                            catch (error) {
                                logger.error(error);
                                break;
                            }
                        }
                    }
                }
                let mapFromUq = new mapData_1.MapFromUq(this);
                let outBody = await mapFromUq.map(json, mapper);
                if (await push(this, uqBus, queue, outBody) === false)
                    break;
                await tool_1.execProc('write_queue_out_p', [moniker, newQueue]);
            }
            // bus in(从外部系统读入数据，写入bus)
            for (;;) {
                if (pull === undefined)
                    break;
                console.log('scan bus in ' + uqBusName + ' at ' + new Date().toLocaleString());
                let queue, uniqueId;
                let retp = await tool_1.tableFromProc('read_queue_in_p', [moniker]);
                //if (retp.length > 0) {
                let r = retp[0];
                queue = r.queue;
                uniqueId = r.uniqueId;
                //} else {
                //    queue = 0;
                //}
                let message = await pull(this, uqBus, queue);
                if (message === undefined)
                    break;
                let { lastPointer: newQueue, data } = message;
                //let newQueue = await this.busIn(queue);
                //if (newQueue === undefined) break;
                let mapToUq = new mapData_1.MapToUq(this);
                let inBody = await mapToUq.map(data[0], mapper);
                // henry??? 暂时不处理bus version
                let busVersion = 0;
                let packed = await faceSchemas_1.faceSchemas.packBusData(face, inBody);
                await this.uqs.writeBus(face, joinName, uniqueId /*newQueue*/, busVersion, packed);
                await tool_1.execProc('write_queue_in_p', [moniker, newQueue]);
            }
        }
    }
    async userOut(face, queue) {
    }
}
exports.Joint = Joint;
//# sourceMappingURL=joint.js.map