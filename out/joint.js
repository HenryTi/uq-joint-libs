"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Joint = void 0;
const log4js_1 = require("log4js");
const defines_1 = require("./defines");
const tool_1 = require("./db/mysql/tool");
const mapData_1 = require("./tool/mapData");
const map_1 = require("./tool/map");
const router_1 = require("./router");
const database_1 = require("./db/mysql/database");
const createMapTable_1 = require("./tool/createMapTable");
const faceSchemas_1 = require("./tool/faceSchemas");
const uqs_1 = require("./uq/uqs");
const host_1 = require("./tool/host");
const centerApi_1 = require("./tool/centerApi");
const notifyScheduler_1 = require("./notifier/notifyScheduler");
const unitx_1 = require("./uq/unitx");
const logger = log4js_1.getLogger('joint');
class Joint {
    constructor(settings, prodOrTest = 'prod') {
        this.notifierScheduler = new notifyScheduler_1.NotifyScheduler();
        this.queueOutPCache = {};
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
        let { unit, uqIns: allUqIns, scanInterval, userName, password } = settings;
        this.unit = unit;
        this.scanInterval = scanInterval || 3000;
        if (allUqIns === undefined)
            return;
        switch (prodOrTest) {
            case 'prod':
                this.uqs = new uqs_1.UqsProd(unit, userName, password);
                this.unitx = new unitx_1.UqUnitxProd(unit);
                break;
            case 'test':
                this.uqs = new uqs_1.UqsTest(unit, userName, password);
                this.unitx = new unitx_1.UqUnitxTest(unit);
                break;
            default:
                throw new Error('prodOrTest not valid in JOINT counstructor:' + prodOrTest);
        }
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
    async getUq(uqFullName) {
        let uq = await this.uqs.getUq(uqFullName);
        return uq;
    }
    async init() {
        await host_1.host.start();
        await this.unitx.init();
        //centerApi.initBaseUrl(host.centerUrl);
        //await this.uqs.init();
    }
    async start() {
        await this.init();
        setTimeout(this.tick, this.scanInterval);
    }
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
                    try {
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
                    }
                    catch (error) {
                        this.notifierScheduler.notify(uq + ":" + entity);
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
                if (!lastPointer) {
                    let e = "读数据的时候，需要返回ID字段，作为进入数据的序号。";
                    console.error(e);
                    throw new Error(e);
                }
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
                        promises.push(pullWrite(this, uqIn, message));
                    else
                        promises.push(this.uqIn(uqIn, message));
                }
                try {
                    await Promise.all(promises);
                    promises.splice(0);
                    await tool_1.execProc('write_queue_in_p', [queueName, lastPointer]);
                }
                catch (error) {
                    this.notifierScheduler.notify(uq + ":" + entity);
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
            if (!body.$id) {
                let { id, inId } = ret;
                if (id) {
                    if (id < 0)
                        id = -id;
                    await map_1.map(defines_1.getMapName(uqIn), id, keyVal);
                    return id;
                }
                else {
                    logger.error('save ' + uqFullName + ':' + tuid + ' no ' + keyVal + ' failed.');
                    logger.error(body);
                }
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
            if (!body.$id) {
                let { id, inId } = ret;
                if (id === undefined)
                    id = inId;
                else if (id < 0)
                    id = -id;
                if (id) {
                    await map_1.map(defines_1.getMapName(uqIn), id, keyVal);
                    return id;
                }
                else {
                    logger.error('save tuid arr ' + uqFullName + ':' + entity + ' no: ' + keyVal + ' failed.');
                    logger.error(body);
                }
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
     * @param ownerVal
     */
    async mapOwner(uqIn, ownerEntity, ownerVal) {
        let ownerSchema = defines_1.getOwnerMapName(uqIn);
        let sql = `select id from \`${database_1.databaseName}\`.\`map_${ownerSchema}\` where no='${ownerVal}'`;
        let ret;
        try {
            ret = await tool_1.execSql(sql);
        }
        catch (err) {
            await createMapTable_1.createMapTable(ownerSchema);
            ret = await tool_1.execSql(sql);
        }
        if (ret.length === 0) {
            try {
                let uq = await this.uqs.getUq(uqIn.uq);
                let vId = await uq.getTuidVId(ownerEntity);
                await map_1.map(ownerSchema, vId, ownerVal);
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
                await uq.delMap(entity, { data: body });
            else
                await uq.setMap(entity, { data: body });
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
    async writeQueueOutP(moniker, p) {
        let lastP = this.queueOutPCache[moniker];
        if (lastP === p)
            return;
        await tool_1.execProc('write_queue_out_p', [moniker, p]);
        this.queueOutPCache[moniker] = p;
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
                await this.writeQueueOutP(queueName, newQueue);
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
                    queue = 0;
                }
                let newQueue, json = undefined;
                if (busFrom === 'center') {
                    let message = await this.userOut(face, queue);
                    /*
                    if (message === null) {
                        newQueue = queue + 1;
                        await this.writeQueueOutP(moniker, newQueue);
                        break;
                    }
                    */
                    if (message === undefined || message['$queue'] === undefined)
                        break;
                    newQueue = message['$queue'];
                    json = message;
                }
                else {
                    let message = await this.unitx.readBus(face, queue);
                    // 订单导入有问题的情况下，按照下面的方法手动导入，其中body的数据schema为order/order定义的
                    /*
                    message = {
                        id: 442662000000012,
                        from: "百灵威系统工程部/order",
                        body: `3	809	200728000002	69463		47036	90503	90503	1	605957	12.00	-12.00	183.00	5	3415	0.00	0.00	0		1\n69928	187032	1	183	183`
                    }
                    */
                    // body: `1	662	200701000011	30771		46623	38265	71494	1	552440	12.00	-12.00	360.00	5		0.00	0.00	0		1\n717	1764	1	121	121\n717	1761	1	239	239`
                    if (message === undefined)
                        break;
                    let { id, from, body } = message;
                    newQueue = id;
                    // 当from是undefined的时候，直接返回的整个队列最大值。没有消息，所以应该退出
                    // 如果没有读到消息，id返回最大消息id，下次从这个地方开始走
                    if (from === undefined) {
                        await this.writeQueueOutP(moniker, newQueue);
                        break;
                    }
                    json = await faceSchemas_1.faceSchemas.unpackBusData(face, body);
                    if (uqIdProps !== undefined) {
                        let uq = await this.uqs.getUq(from);
                        if (uq !== undefined) {
                            try {
                                let newJson = await uq.buildData(json, uqIdProps);
                                json = newJson;
                            }
                            catch (error) {
                                await this.notifierScheduler.notify(moniker);
                                logger.error(error);
                                break;
                            }
                        }
                    }
                }
                if (json !== undefined) {
                    let mapFromUq = new mapData_1.MapFromUq(this);
                    let outBody = await mapFromUq.map(json, mapper);
                    try {
                        let succes = await push(this, uqBus, queue, outBody);
                        if (!succes)
                            break;
                    }
                    catch (error) {
                        await this.notifierScheduler.notify(moniker);
                        break;
                    }
                }
                await this.writeQueueOutP(moniker, newQueue);
            }
            // bus in(从外部系统读入数据，写入bus)
            for (;;) {
                if (pull === undefined)
                    break;
                console.log('scan bus in ' + uqBusName + ' at ' + new Date().toLocaleString());
                let queue, uniqueId;
                let retp = await tool_1.tableFromProc('read_queue_in_p', [moniker]);
                let r = retp[0];
                queue = r.queue;
                uniqueId = r.uniqueId;
                let message = await pull(this, uqBus, queue);
                if (message === undefined)
                    break;
                let { lastPointer: newQueue, data } = message;
                let mapToUq = new mapData_1.MapToUq(this);
                let inBody = await mapToUq.map(data[0], mapper);
                // henry??? 暂时不处理bus version
                let busVersion = 0;
                let packed = await faceSchemas_1.faceSchemas.packBusData(face, inBody);
                await this.unitx.writeBus(face, joinName, uniqueId /*newQueue*/, busVersion, packed);
                await tool_1.execProc('write_queue_in_p', [moniker, newQueue]);
            }
        }
    }
    async userOut(face, queue) {
        let result = await centerApi_1.centerApi.queueOut(queue, 1);
        if (result && result.length === 1 && result[0])
            return result[0];
        return undefined;
    }
}
exports.Joint = Joint;
//# sourceMappingURL=joint.js.map