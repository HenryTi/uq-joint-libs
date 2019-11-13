import { Entity } from "./entity";
import { Uq } from "./uq";
import { UqApi } from '../tool/uqApi';

const maxCacheSize = 1000;
class Cache {
    private values: { [id: number]: any } = {};
    private queue: number[] = [];

    getValue(id: number): any {
        let ret = this.values[id];
        if (ret === undefined) return;
        this.moveToHead(id);
        return ret;
    }
    setValue(id: number, value: any) {
        if (this.queue.length >= maxCacheSize) {
            let removeId = this.queue.shift();
            delete this.values[removeId];
        }
        if (this.values[id] !== undefined) {
            this.moveToHead(id);
        }
        else {
            this.queue.push(id);
        }
        this.values[id] = value;
    }

    private moveToHead(id: number) {
        let index = this.queue.findIndex(v => v === id);
        this.queue.splice(index, 1);
        this.queue.push(id);
    }
}


export abstract class Tuid extends Entity {
    private cache: Cache = new Cache;
    private cacheAllProps: Cache = new Cache;
    protected fromUq: Uq;

    owner: TuidMain;                    // 用这个值来区分是不是TuidArr
    from: { owner: string, uq: string };
    get typeName(): string { return 'tuid'; }
    getIdFromObj(obj: any) { return obj.id }
    /*
    async getApiFrom() {
        if (this.from === undefined) return this.uq.openApi;
        if (this.fromUq === undefined) {
            let {owner, uq:uqName} = this.from;
            this.fromUq = await this.uq.getFromUq(owner+'/'+uqName);
        }
        return this.fromUq.openApi;
    }
    */
    public setSchema(schema: any) {
        super.setSchema(schema);
        this.from = schema.from;
    }
    async getTuidFrom(): Promise<Tuid> {
        if (this.from === undefined) return this;
        if (this.fromUq === undefined) {
            let { owner, uq: uqName } = this.from;
            this.fromUq = await this.uq.getFromUq(owner + '/' + uqName);
        }
        return this.fromUq.getTuidFromName(this.name);
    }
    async loadValue(id: number, ownerId: number, allProps: boolean): Promise<any> {
        let ret: any;
        if (allProps === true) {
            ret = this.cacheAllProps.getValue(id);
        }
        else {
            ret = this.cache.getValue(id);
        }
        if (ret !== undefined) return ret;
        //let openApi = await this.getApiFrom();
        let tuidValue = await this.internalLoadTuidValue(this.uq, id, ownerId, allProps);
        if (tuidValue.length > 0)
            ret = tuidValue[0];
        else
            ret = undefined;
        if (allProps === true)
            this.cacheAllProps.setValue(id, ret);
        else
            this.cache.setValue(id, ret);
        return ret;
    }
    protected abstract internalLoadTuidValue(uq:Uq, id: number, ownerId: number, allProps: boolean): Promise<any>;
}

export class TuidMain extends Tuid {
    get Main() { return this }
    //get uqApi() { return this.uq.uqApi };

    divs: { [name: string]: TuidDiv };

    public setSchema(schema: any) {
        super.setSchema(schema);
        let { arrs } = schema;
        if (arrs !== undefined) {
            this.divs = {};
            for (let arr of arrs) {
                let { name } = arr;
                let tuidDiv = new TuidDiv(this.uq, name, this.typeId);
                tuidDiv.owner = this;
                this.divs[name] = tuidDiv;
                tuidDiv.setSchema(arr);
            }
        }
    }
    protected async internalLoadTuidValue(uq: Uq, id: number, ownerId: number, allProps: boolean): Promise<any> {
        return uq.loadTuidMainValue(this.name, id, allProps);
    }
}

export class TuidDiv extends Tuid {
    get Main() { return this.owner }

    async getTuidFrom(): Promise<Tuid> {
        let ownerFrom = await this.owner.getTuidFrom() as TuidMain;
        if (ownerFrom === this.owner) return this;
        return ownerFrom.divs[this.name];
        /*
                if (this.fromUq === undefined) {
                    let {owner, uq:uqName} = this.from;
                    this.fromUq = await this.uq.getFromUq(owner+'/'+uqName);
                }
                return this.fromUq.getTuidFromName(this.name);
        */
    }
    /*
    async getApiFrom() {
        return await this.owner.getApiFrom();
    }
    */

    protected async internalLoadTuidValue(uq: Uq, id: number, ownerId: number, allProps: boolean): Promise<any> {
        return await uq.loadTuidDivValue(this.owner.name, this.name, id, ownerId, allProps);
    }
}
