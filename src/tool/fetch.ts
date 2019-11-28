import fetch, {Headers} from 'node-fetch';
//import { centerApi } from './centerApi';

export abstract class Fetch {
    private baseUrl:string;
    protected get apiToken(): string {return undefined;}
    constructor(baseUrl?:string) {
        this.baseUrl = baseUrl;
    }
    initBaseUrl(baseUrl:string) {
        this.baseUrl = baseUrl;
    }
    protected async get(url: string, params: any = undefined): Promise<any> {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
                    if (v === undefined) continue;
                    url += c + k + '=' + encodeURIComponent(params[k]);
                    c = '&';
                }
            }
        }
        return await this.innerFetch(url, 'GET');
    }

    protected async post(url: string, params: any): Promise<any> {
        return await this.innerFetch(url, 'POST', params);
    }

    protected appendHeaders(headers:Headers) {
    }


    protected async innerFetchResult(url: string, method:string, body?:any): Promise<any> {
        // console.log('innerFetch ' + method + '  ' + this.baseUrl + url);
        var headers = new Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        if (this.apiToken !== undefined) headers.append('Authorization', this.apiToken);
        this.appendHeaders(headers);
        url = this.baseUrl + url;
        switch (typeof (body)) {
            default: body = JSON.stringify(body); break;
            case 'string': break;
        }
        let fetchInit = {
            headers: headers, /*{
                "Content-Type": 'application/json',
                "Accept": 'application/json',
                //"Authorization": 'this.apiToken',
                //"Access-Control-Allow-Origin": '*'
            },*/
            method: method,
            body: body,
        };
        let res = await fetch(url, fetchInit);
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

    private async innerFetch(url: string, method:string, body?:any): Promise<any> {
        let ret = await this.innerFetchResult(url, method, body);
        if (ret) return ret.res;
        return ret;
    }
}
