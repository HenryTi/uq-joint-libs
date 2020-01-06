import { Router } from "express";
import { getLogger } from 'log4js';

import { Settings, UqIn, UqOut, DataPush, UqInTuid, UqInMap, UqInTuidArr, DataPullResult } from "./defines";
import { tableFromProc, execProc, execSql } from "./db/mysql/tool";
import { MapFromUq as MapFromUq, MapToUq as MapToUq, MapUserToUq } from "./tool/mapData";
import { map } from "./tool/map"; 
import { createRouter } from './router';
import { databaseName } from "./db/mysql/database";
import { createMapTable } from "./tool/createMapTable";
import { faceSchemas } from "./tool/faceSchemas";
import { Uqs } from "./uq/uqs";
//import { centerApi } from "./tool/centerApi";
import { host } from "./tool/host";
import { Uq } from "./uq/uq";

const logger = getLogger('joint');

export class Joint {
    protected uqs: Uqs;
    protected settings: Settings;
    private tickCount: number = -1;
    private scanInterval: number;

    constructor(settings: Settings) {
        this.settings = settings;
        let { unit, uqIns: allUqIns, scanInterval, userName, password } = settings;
        this.unit = unit;
        this.scanInterval = scanInterval || 3000;
        if (allUqIns === undefined) return;
        this.uqs = new Uqs(unit, userName, password);
        for (let uqIn of allUqIns) {
            let { entity, type } = uqIn;
            if (this.uqInDict[entity] !== undefined) throw 'can not have multiple ' + entity;
            this.uqInDict[entity] = uqIn;
        }
    }

    readonly uqInDict: { [tuid: string]: UqIn } = {};
    readonly unit: number;

    createRouter(): Router {
        return createRouter(this.settings);
    }

    /*
    async getUqApi(uqFullName:string):Promise<UqApi> {
        let uq = await this.uqs.getUq(uqFullName);
        return uq.uqApi;
    }
    */

    async getUq(uqFullName:string):Promise<Uq> {
        let uq = await this.uqs.getUq(uqFullName);
        return uq;
    }

    async init() {
        await host.start();
        //centerApi.initBaseUrl(host.centerUrl);
        await this.uqs.init();
    }

    async start() {
        await this.init();
        setTimeout(this.tick, this.scanInterval);
    }

    private tick = async () => {
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
    private async scanIn() {

        let { pullReadFromSql, uqInEntities } = this.settings;
        if (uqInEntities === undefined) return;

        for (let uqInName of uqInEntities) {

            let uqIn = this.uqInDict[uqInName.name];
            if (uqIn === undefined) continue;

            let { uq, type, entity, pull, pullWrite } = uqIn;
            if (this.tickCount % (uqInName.intervalUnit || 1) !== 0) continue;
            let queueName = uq + ':' + entity;
            console.log('scan in ' + queueName + ' at ' + new Date().toLocaleString());
            let promises: PromiseLike<any>[] = [];
            for (; ;) {
                let message: any;
                let queue: string;
                let ret: DataPullResult = undefined;
                if (pull !== undefined) {
                    let retp = await tableFromProc('read_queue_in_p', [queueName]);
                    if (retp.length > 0) {
                        queue = retp[0].queue;
                    } else {
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
                            ret = await pullReadFromSql(pull as string, queue);
                            break;
                    }
                    if (ret === undefined) break;
                    // queue = ret.queue;
                    // message = ret.data;
                }
                else {
                    let retp = await tableFromProc('read_queue_in', [queueName]);
                    if (!retp || retp.length === 0) break;
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
                        let no = message[(uqIn as UqInTuid).key];
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
                    await execProc('write_queue_in_p', [queueName, lastPointer]);
                } catch (error) {
                    logger.error(error);
                    break;
                }
            }
        }
    }

    async uqIn(uqIn: UqIn, data: any) {
        switch (uqIn.type) {
            case 'tuid': await this.uqInTuid(uqIn as UqInTuid, data); break;
            case 'tuid-arr': await this.uqInTuidArr(uqIn as UqInTuidArr, data); break;
            case 'map': await this.uqInMap(uqIn as UqInMap, data); break;
        }
    }

    protected async uqInTuid(uqIn: UqInTuid, data: any): Promise<number> {
        let { key, mapper, uq: uqFullName, entity: tuid } = uqIn;
        if (key === undefined) throw 'key is not defined';
        if (uqFullName === undefined) throw 'tuid ' + tuid + ' not defined';
        let keyVal = data[key];
        let mapToUq = new MapToUq(this);
        let body = await mapToUq.map(data, mapper);
        let uq = await this.uqs.getUq(uqFullName);
        try {
            let ret = await uq.saveTuid(tuid, body);
            let { id, inId } = ret;
            if (id) {
                if (id < 0) id = -id;
                await map(tuid, id, keyVal);
                return id;
            } else {
                logger.error('save ' + uqFullName + ':' + tuid + ' no ' + keyVal + ' failed.');
                logger.error(body);
            }
        } catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInTuid(uqIn, data);
            } else {
                logger.error(uqFullName + ':' + tuid);
                logger.error(body);
                throw error;
            }
        }
    }

    protected async uqInTuidArr(uqIn: UqInTuidArr, data: any): Promise<number> {
        let { key, owner, mapper, uq: uqFullName, entity } = uqIn;
        if (key === undefined) throw 'key is not defined';
        if (uqFullName === undefined) throw 'uq ' + uqFullName + ' not defined';
        if (entity === undefined) throw 'tuid ' + entity + ' not defined';
        let parts = entity.split('_');
        let tuidOwner = parts[0];
        if (parts.length === 1) throw 'tuid ' + entity + ' must has .arr';
        let tuidArr = parts[1];
        let keyVal = data[key];
        if (owner === undefined) throw 'owner is not defined';
        let ownerVal = data[owner];
        try {
            let mapToUq = new MapToUq(this);
            let ownerId = await this.mapOwner(uqIn, tuidOwner, ownerVal);
            if (ownerId === undefined) throw 'owner value is undefined';
            let body = await mapToUq.map(data, mapper);
            let uq = await this.uqs.getUq(uqFullName);
            let ret = await uq.saveTuidArr(tuidOwner, tuidArr, ownerId, body);
            let { id, inId } = ret;
            if (id === undefined) id = inId;
            else if (id < 0) id = -id;
            if (id) {
                await map(entity, id, keyVal);
                return id;
            } else {
                logger.error('save tuid arr ' + uqFullName + ':' + entity + ' no: ' + keyVal + ' failed.');
                logger.error(body);
            }
        } catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInTuidArr(uqIn, data);
            } else {
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
    private async mapOwner(uqIn: UqInTuidArr, ownerEntity: string, ownerVal: any) {
        let { uq: uqFullName } = uqIn;
        let sql = `select id from \`${databaseName}\`.\`map_${ownerEntity.toLowerCase()}\` where no='${ownerVal}'`;
        let ret: any[];
        try {
            ret = await execSql(sql);
        }
        catch (err) {
            await createMapTable(ownerEntity);
            ret = await execSql(sql);
        }
        if (ret.length === 0) {
            try {
                let uq = await this.uqs.getUq(uqFullName);
                let vId = await uq.getTuidVId(ownerEntity);
                await map(ownerEntity, vId, ownerVal);
                return vId;
            } catch (error) {
                if (error.code === "ETIMEDOUT") {
                    logger.error(error);
                    this.mapOwner(uqIn, ownerEntity, ownerVal);
                } else {
                    throw error;
                }

            }
        }
        return ret[0]['id'];
    }

    protected async uqInMap(uqIn: UqInMap, data: any): Promise<void> {
        let { mapper, uq: uqFullName, entity } = uqIn;
        let mapToUq = new MapToUq(this);
        let body = await mapToUq.map(data, mapper);

        try {
            let uq = await this.uqs.getUq(uqFullName);
            let { $ } = data;
            if ($ === '-')
                await uq.delMap(entity, {data:body});
            else
                await uq.setMap(entity, {data:body});
        } catch (error) {
            if (error.code === "ETIMEDOUT") {
                logger.error(error);
                await this.uqInMap(uqIn, data);
            } else {
                throw error;
            }
        }
    }

    /**
     *
     */
    private async scanOut() {
        let { uqOuts } = this.settings;
        if (uqOuts === undefined) return;
        for (let uqOut of uqOuts) {
            let { uq, entity } = uqOut;
            let queueName = uq + ':' + entity;
            console.log('scan out ' + queueName);
            for (; ;) {
                let queue: number;
                let retp = await tableFromProc('read_queue_out_p', [queueName]);
                if (retp.length === 0) queue = 0;
                else queue = retp[0].queue;
                let ret: { queue: number, data: any };
                ret = await this.uqOut(uqOut, queue);
                if (ret === undefined) break;
                let { queue: newQueue, data } = ret;
                await execProc('write_queue_out_p', [queueName, newQueue]);
            }
        }
    }

    async uqOut(uqOut: UqOut, queue: number): Promise<{ queue: number, data: any }> {
        let ret: { queue: number, data: any };
        let { type } = uqOut;
        switch (type) {
            //case 'bus': ret = await this.uqOutBus(uqOut as UqOutBus, queue); break;
        }
        return ret;
    }

    /**
     * 通过bus做双向数据同步（bus out和bus in)
     */
    protected async scanBus() {
        let { name: joinName, bus, uqBusSettings } = this.settings;
        if (bus === undefined) return;
        if (uqBusSettings === undefined) return;

        let monikerPrefix = '$bus/';

        for (let uqBusName of uqBusSettings) {
            let uqBus = bus[uqBusName];
            let { face, from: busFrom, mapper, push, pull, uqIdProps } = uqBus;
            // bus out(从bus中读取消息，发送到外部系统)
            let moniker = monikerPrefix + face;
            for (; ;) {
                if (push === undefined) break;
                console.log('scan bus out ' + uqBusName + ' at ' + new Date().toLocaleString());
                let queue: number;
                let retp = await tableFromProc('read_queue_out_p', [moniker]);
                if (retp.length > 0) {
                    queue = retp[0].queue;
                } else {
                    // queue = 430000000000000;
                    queue = 0;
                }
                let newQueue, json;
                if (busFrom === 'center') {
                    let message = await this.userOut(face, queue);
                    if (message === null) {
                        newQueue = queue + 1;
                        await execProc('write_queue_out_p', [moniker, newQueue]);
                        break;
                    }
                    if (message === undefined || message['$queue'] === undefined) break;
                    newQueue = message['$queue'];
                    json = message;
                } else {
                    let message = await this.uqs.readBus(face, queue);
                    if (message === undefined) break;
                    let { id, from, body } = message;
                    newQueue = id;
                    json = await faceSchemas.unpackBusData(face, body);
                    if (uqIdProps !== undefined && from !== undefined) {
                        let uq = await this.uqs.getUq(from);
                        if (uq !== undefined) {
                            try {
                                let newJson = await uq.buildData(json, uqIdProps);
                                json = newJson;
                            } catch (error) {
                                logger.error(error);
                                break;
                            }
                        }
                    }
                }

                let mapFromUq = new MapFromUq(this);
                let outBody = await mapFromUq.map(json, mapper);
                if (await push(this, uqBus, queue, outBody) === false) break;
                await execProc('write_queue_out_p', [moniker, newQueue]);
            }

            // bus in(从外部系统读入数据，写入bus)
            for (; ;) {
                if (pull === undefined) break;
                console.log('scan bus in ' + uqBusName + ' at ' + new Date().toLocaleString());
                let queue: number, uniqueId: number;
                let retp = await tableFromProc('read_queue_in_p', [moniker]);
                //if (retp.length > 0) {
                    let r = retp[0];
                    queue = r.queue;
                    uniqueId = r.uniqueId;
                //} else {
                //    queue = 0;
                //}
                let message = await pull(this, uqBus, queue);
                if (message === undefined) break;
                let { lastPointer: newQueue, data } = message;
                //let newQueue = await this.busIn(queue);
                //if (newQueue === undefined) break;
                let mapToUq = new MapToUq(this);
                let inBody = await mapToUq.map(data[0], mapper);
                // henry??? 暂时不处理bus version
                let busVersion = 0;
                let packed = await faceSchemas.packBusData(face, inBody);
                await this.uqs.writeBus(face, joinName, uniqueId/*newQueue*/, busVersion, packed);
                await execProc('write_queue_in_p', [moniker, newQueue]);
            }
        }
    }

    protected async userOut(face: string, queue: number) {        
    }

/*
    protected async userOut(face: string, queue: number) {
        let ret = await centerApi.queueOut(queue, 1);
        if (ret !== undefined && ret.length === 1) {
            let user = ret[0];
            if (user === null) return user;
            return this.decryptUser(user);
        }
    }

    public async userOutOne(id: number) {
        let user = await centerApi.queueOutOne(id);
        if (user) {
            user = this.decryptUser(user);
            let mapFromUq = new MapFromUq(this);
            let outBody = await mapFromUq.map(user, faceUser.mapper);
            return outBody;
        }
    }

    protected decryptUser(user: { pwd: string }) {
        let pwd = user.pwd;
        if (!pwd)
            user.pwd = '123456';
        else
            user.pwd = decrypt(pwd);
        if (!user.pwd) user.pwd = '123456';
        return user;
    }

    public async userIn(uqIn: UqInTuid, data: any): Promise<number> {
        let { key, mapper, uq: uqFullName, entity: tuid } = uqIn;
        if (key === undefined) throw 'key is not defined';
        if (uqFullName === undefined) throw 'tuid ' + tuid + ' not defined';
        let keyVal = data[key];
        let mapToUq = new MapUserToUq(this);
        try {
            let body = await mapToUq.map(data, mapper);
            if (body.id <= 0) {
                delete body.id;
            }
            let ret = await centerApi.queueIn(body);
            if (!body.id && (ret === undefined || typeof ret !== 'number')) {
                console.error(body);
                let { id: code, message } = ret as any;
                switch (code) {
                    case -2:
                        data.Email += '\t';
                        ret = await this.userIn(uqIn, data);
                        break;
                    case -3:
                        data.Mobile += '\t';
                        ret = await this.userIn(uqIn, data);
                        break;
                    default:
                        console.error(ret);
                        ret = -5;
                        break;
                }
            }
            if (ret > 0) {
                await map(tuid, ret, keyVal);
            }
            return body.id || ret;
        } catch (error) {
            throw error;
        }
    }
*/
}
