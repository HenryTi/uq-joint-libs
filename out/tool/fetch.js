"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = void 0;
const node_fetch_1 = __importStar(require("node-fetch"));
class Fetch {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    get apiToken() { return undefined; }
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
    async innerFetchResult(url, method, body) {
        // console.log('innerFetch ' + method + '  ' + this.baseUrl + url);
        var headers = new node_fetch_1.Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        if (this.apiToken !== undefined)
            headers.append('Authorization', this.apiToken);
        this.appendHeaders(headers);
        url = this.baseUrl + url;
        switch (typeof (body)) {
            default:
                body = JSON.stringify(body);
                break;
            case 'string': break;
        }
        let fetchInit = {
            headers: headers,
            method: method,
            body: body,
        };
        let res = await (0, node_fetch_1.default)(url, fetchInit);
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
            return json;
        }
        return json;
    }
    async innerFetch(url, method, body) {
        let ret = await this.innerFetchResult(url, method, body);
        if (ret)
            return ret.res;
        return ret;
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=fetch.js.map