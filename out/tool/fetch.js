"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importStar(require("node-fetch"));
class Fetch {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    initBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async get(url, params = undefined) {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
                    if (v === undefined)
                        continue;
                    url += c + k + '=' + encodeURIComponent(params[k]);
                    c = '&';
                }
            }
        }
        return await this.innerFetch(url, 'GET');
    }
    async post(url, params) {
        return await this.innerFetch(url, 'POST', params);
    }
    appendHeaders(headers) {
    }
    async innerFetch(url, method, body) {
        // console.log('innerFetch ' + method + '  ' + this.baseUrl + url);
        var headers = new node_fetch_1.Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        this.appendHeaders(headers);
        let res = await node_fetch_1.default(this.baseUrl + url, {
            headers: headers,
            method: method,
            body: JSON.stringify(body),
        });
        if (res.status !== 200) {
            console.error(res.statusText, res.status);
            throw {
                error: res.statusText,
                code: res.status,
            };
            //console.log('statusCode=', response.statusCode);
            //console.log('statusMessage=', response.statusMessage);
        }
        let json = await res.json();
        if (json.error !== undefined) {
            throw json.error;
        }
        if (json.ok === true) {
            return json.res;
        }
        return json;
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=fetch.js.map