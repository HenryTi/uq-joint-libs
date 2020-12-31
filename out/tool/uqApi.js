"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqApi = exports.Caller = void 0;
const node_fetch_1 = require("node-fetch");
const fetch_1 = require("./fetch");
class Caller {
    constructor(params, waiting) {
        this.method = 'POST';
        this._params = params;
        this.waiting = waiting;
    }
    get params() { return this._params; }
    buildParams() { return this.params; }
    get headers() { return undefined; }
}
exports.Caller = Caller;
const methodsWithBody = ['POST', 'PUT'];
class UqApi extends fetch_1.Fetch {
    constructor(baseUrl, unit, apiToken) {
        super(baseUrl);
        this.unit = unit;
        this._apiToken = apiToken;
    }
    get apiToken() { return this._apiToken; }
    async xcall(caller) {
        let urlPrefix = 'tv/';
        let options = this.buildOptions();
        let { headers, path, method } = caller;
        if (headers !== undefined) {
            let h = options.headers;
            for (let i in headers) {
                h.append(i, encodeURI(headers[i]));
            }
        }
        options.method = method;
        let p = caller.buildParams();
        if (methodsWithBody.indexOf(method) >= 0 && p !== undefined) {
            options.body = JSON.stringify(p);
        }
        //return await this.innerFetch(urlPrefix + path, options, caller.waiting);
        return await this.innerFetchResult(urlPrefix + path, method, options.body);
    }
    buildOptions() {
        let headers = this.buildHeaders();
        let options = {
            headers: headers,
            method: undefined,
            body: undefined,
        };
        return options;
    }
    buildHeaders() {
        //let {language, culture} = nav;
        let headers = new node_fetch_1.Headers();
        //headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json;charset=UTF-8');
        //let lang = language;
        //if (culture) lang += '-' + culture;
        //headers.append('Accept-Language', lang);
        if (this.apiToken) {
            headers.append('Authorization', this.apiToken);
        }
        return headers;
    }
    appendHeaders(headers) {
        headers.append('unit', String(this.unit));
    }
    async bus(faces, faceUnitMessages) {
        let ret = await this.post('open/bus', {
            faces: faces,
            faceUnitMessages: faceUnitMessages,
        });
        return ret;
    }
    async tuid(unit, id, tuid, maps) {
        let ret = await this.post('open/tuid', {
            unit: unit,
            id: id,
            tuid: tuid,
            maps: maps,
        });
        return ret;
    }
    async saveTuid(tuid, data) {
        let ret = await this.post('joint/tuid/' + tuid, data);
        return ret;
    }
    async saveTuidArr(tuid, arr, owner, data) {
        let ret = await this.post(`joint/tuid-arr/${tuid}/${owner}/${arr}`, data);
        return ret;
    }
    async getTuidVId(tuid) {
        let parts = tuid.split('_');
        let url;
        if (parts.length === 1)
            url = `joint/tuid-vid/${tuid}`;
        else
            url = `joint/tuid-arr-vid/${parts[0]}/${parts[1]}`;
        let ret = await this.get(url);
        return ret;
    }
    async scanSheet(sheet, scanStartId) {
        let ret = await this.get('joint/sheet-scan/' + sheet + '/' + scanStartId);
        return ret;
    }
    async action(action, data) {
        await this.post('joint/action-json/' + action, data);
    }
    async setMap(map, data) {
        await this.post('joint/action-json/' + map + '$add$', data);
    }
    async delMap(map, data) {
        await this.post('joint/action-json/' + map + '$del$', data);
    }
    async loadTuidMainValue(tuidName, id, allProps) {
        let ret = await this.post(`open/tuid-main/${tuidName}`, { unit: this.unit, id: id, all: allProps });
        return ret;
    }
    async loadTuidDivValue(tuidName, divName, id, ownerId, allProps) {
        let ret = await this.post(`open/tuid-div/${tuidName}/${divName}`, { unit: this.unit, id: id, ownerId: ownerId, all: allProps });
        return ret;
    }
    async loadEntities() {
        return await this.get('open/entities/' + this.unit);
    }
    async schema(entityName) {
        return await this.get('open/entity/' + entityName);
    }
}
exports.UqApi = UqApi;
//# sourceMappingURL=uqApi.js.map