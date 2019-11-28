import { Headers } from "node-fetch";
import { Fetch } from "./fetch";

export interface BusMessage {
    id: number;
    face: string;
    from: string;
    body: string;
}

export abstract class Caller<T> {
    protected readonly _params: T;
    constructor(params: T, waiting: boolean) {
        this._params = params;
        this.waiting = waiting;
    }
    protected get params():any {return this._params;}
    buildParams():any {return this.params;}
    method: string  = 'POST';
    abstract get path(): string;
    get headers(): {[header:string]: string} {return undefined}
    waiting: boolean;
}

const methodsWithBody = ['POST', 'PUT'];

/**
 * 这个OpenApi好像是没有用
 */
export class UqApi extends Fetch {
    private _apiToken:string;
    protected unit: number;
    protected get apiToken(): string {return this._apiToken;}
    constructor(baseUrl: string, unit: number, apiToken?:string) {
        super(baseUrl);
        this.unit = unit;
        this._apiToken = apiToken;
    }

    async xcall(caller:Caller<any>): Promise<any> {
        let urlPrefix:string = 'tv/';
        let options = this.buildOptions();
        let {headers, path, method} = caller;
        if (headers !== undefined) {
            let h = options.headers;
            for (let i in headers) {
                h.append(i, encodeURI(headers[i]));
            }
        }
        options.method = method;
        let p = caller.buildParams();
        if (methodsWithBody.indexOf(method) >= 0 && p !== undefined) {
            options.body = JSON.stringify(p)
        }
        //return await this.innerFetch(urlPrefix + path, options, caller.waiting);
        return await this.innerFetchResult(urlPrefix + path, method, options.body);
    }
    private buildOptions(): {method:string; headers:Headers; body:any} {
        let headers = this.buildHeaders();
        let options = {
            headers: headers,
            method: undefined as any,
            body: undefined as any,
            // cache: 'no-cache',
        };
        return options;
    }

    protected buildHeaders():Headers {
        //let {language, culture} = nav;
        let headers = new Headers();
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

    protected appendHeaders(headers: Headers) {
        headers.append('unit', String(this.unit));
    }

    async bus(faces: string, faceUnitMessages: string) {
        let ret = await this.post('open/bus', {
            faces: faces,
            faceUnitMessages: faceUnitMessages,
        });
        return ret;
    }
    async readBus(face: string, queue: number): Promise<BusMessage> {
        //let ret = await this.post('open/joint-read-bus', {
        let ret = await this.post('joint-read-bus', {
            unit: this.unit,
            face: face,
            queue: queue
        });
        return ret;
    }
    async writeBus(face: string, from: string, queue: number | string, busVersion: number, body: string): Promise<BusMessage> {
        //let ret = await this.post('open/joint-write-bus', {
        let ret = await this.post('joint-write-bus', {
            unit: this.unit,
            face: face,
            from: from,
            fromQueueId: queue,
            version: busVersion,
            body: body,
        });
        return ret;
    }
    async tuid(unit: number, id: number, tuid: string, maps: string[]): Promise<any> {
        let ret = await this.post('open/tuid', {
            unit: unit,
            id: id,
            tuid: tuid,
            maps: maps,
        });
        return ret;
    }
    async saveTuid(tuid: string, data: any): Promise<any> {
        let ret = await this.post('joint/tuid/' + tuid, data);
        return ret;
    }
    async saveTuidArr(tuid: string, arr: string, owner: number, data: any): Promise<any> {
        let ret = await this.post(`joint/tuid-arr/${tuid}/${owner}/${arr}`, data);
        return ret;
    }
    async getTuidVId(tuid: string): Promise<number> {
        let parts = tuid.split('_');
        let url: string;
        if (parts.length === 1)
            url = `joint/tuid-vid/${tuid}`;
        else
            url = `joint/tuid-arr-vid/${parts[0]}/${parts[1]}`;
        let ret = await this.get(url);
        return ret;
    }
    async scanSheet(sheet: string, scanStartId: number): Promise<any> {
        let ret = await this.get('joint/sheet-scan/' + sheet + '/' + scanStartId);
        return ret;
    }
    async action(action: string, data: any): Promise<void> {
        await this.post('joint/action-json/' + action, data);
    }
    async setMap(map: string, data: any): Promise<void> {
        await this.post('joint/action-json/' + map + '$add$', data);
    }
    async delMap(map: string, data: any): Promise<void> {
        await this.post('joint/action-json/' + map + '$del$', data);
    }
    /*
    }
    
    export class OpenApi extends Fetch {
    */
    /*
        protected unit: number;
        constructor(baseUrl: string, unit: number) {
            super(baseUrl);
            this.unit = unit;
        }
    */
    /*
        protected appendHeaders(headers: Headers) {
            headers.append('unit', String(this.unit));
        }
    
        async fresh(unit: number, stamps: any): Promise<any> {
            let ret = await this.post('open/fresh', {
                unit: unit,
                stamps: stamps
            });
            return ret;
        }
        async bus(faces: string, faceUnitMessages: string) {
            let ret = await this.post('open/bus', {
                faces: faces,
                faceUnitMessages: faceUnitMessages,
            });
            return ret;
        }
        async readBus(face: string, queue: number): Promise<BusMessage> {
            let ret = await this.post('open/joint-read-bus', {
                unit: this.unit,
                face: face,
                queue: queue
            });
            return ret;
        }
        async writeBus(face: string, from: string, queue: string | number, body: string): Promise<BusMessage> {
            let ret = await this.post('open/joint-write-bus', {
                unit: this.unit,
                face: face,
                from: from,
                sourceId: queue,
                body: body,
            });
            return ret;
        }
    */
    /*
        async tuid(id: number, tuid: string, maps: string[]): Promise<any> {
            let ret = await this.post('open/tuid', {
                unit: this.unit,
                id: id,
                tuid: tuid,
                maps: maps,
            });
            return ret;
        }
        async saveTuid(tuid: string, data: any): Promise<any> {
            let ret = await this.post('joint/tuid/' + tuid, data);
            return ret;
        }
        async saveTuidArr(tuid: string, arr: string, owner: number, data: any): Promise<any> {
            try {
                let ret = await this.post(`joint/tuid-arr/${tuid}/${owner}/${arr}`, data);
                return ret;
            } catch (error) {
                console.error(error);
                if (error.code === 'ETIMEDOUT')
                    await this.saveTuidArr(tuid, arr, owner, data);
                else
                    throw error;
            }
        }
        async getTuidVId(tuid: string): Promise<number> {
            let parts = tuid.split('.');
            let url: string;
            if (parts.length === 1)
                url = `joint/tuid-vid/${tuid}`;
            else
                url = `joint/tuid-arr-vid/${parts[0]}/${parts[1]}`;
            let ret = await this.get(url);
            return ret;
        }
    */
    async loadTuidMainValue(tuidName: string, id: number, allProps: boolean) {
        let ret = await this.post(`open/tuid-main/${tuidName}`,
            { unit: this.unit, id: id, all: allProps });
        return ret;
    }
    async loadTuidDivValue(tuidName: string, divName: string, id: number, ownerId: number, allProps: boolean) {
        let ret = await this.post(`open/tuid-div/${tuidName}/${divName}`,
            { unit: this.unit, id: id, ownerId: ownerId, all: allProps });
        return ret;
    }
    /*
        async scanSheet(sheet: string, scanStartId: number): Promise<any> {
            let ret = await this.get('joint/sheet-scan/' + sheet + '/' + scanStartId);
            return ret;
        }
        async action(action: string, data: any): Promise<void> {
            await this.post('joint/action-json/' + action, data);
        }
        async setMap(map: string, data: any): Promise<void> {
            await this.post('joint/action-json/' + map + '$add$', data);
        }
        async delMap(map: string, data: any): Promise<void> {
            await this.post('joint/action-json/' + map + '$del$', data);
        }
    */
    async loadEntities() {
        return await this.get('open/entities/' + this.unit);
    }

    async schema(entityName: string) {
        return await this.get('open/entity/' + entityName);
    }
}
