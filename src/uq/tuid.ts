import _ from 'lodash';
import { Entity } from "./entity";
import { Uq } from "./uq";
import { EntityCaller } from "./caller";
import { Field } from "./field";

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

export interface TuidSaveResult {
    id: number;
    inId: number;
}

export abstract class Tuid extends Entity {
    private cache: Cache = new Cache;
    private cacheAllProps: Cache = new Cache;
    protected fromUq: Uq;

    owner: TuidMain;                    // 用这个值来区分是不是TuidArr
    from: { owner: string, uq: string };
    get typeName(): string { return 'tuid'; }
    getIdFromObj(obj: any) { return obj.id }
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

    async save(id:number, props:any):Promise<TuidSaveResult> {
        let ret = new SaveCaller(this, {id:id, props:props}).request();
        return ret;
    }
    async all():Promise<any[]> {
        let ret: any[] = await new AllCaller(this, {}).request();
        return ret;
    }
    async search(key:string, pageStart:string|number, pageSize:number):Promise<any[]> {
        let ret:any[] = await this.searchArr(undefined, key, pageStart, pageSize);
        return ret;
    }
    async searchArr(owner:number, key:string, pageStart:string|number, pageSize:number):Promise<any> {
        let params:any = {arr:undefined, owner:owner, key:key, pageStart:pageStart, pageSize:pageSize};
        let ret = await new SearchCaller(this, params).request();
        return ret;
    }
    async loadArr(arr:string, owner:number, id:number):Promise<any> {
        if (id === undefined || id === 0) return;
        //let api = this.uqApi;
        //return await api.tuidArrGet(this.name, arr, owner, id);
        return await new LoadArrCaller(this, {arr:arr, owner:owner, id:id}).request();
    }
    async saveArr(arr:string, owner:number, id:number, props:any) {
        //let params = _.clone(props);
        //params["$id"] = id;
        //return await this.uqApi.tuidArrSave(this.name, arr, owner, params);
        return await new SaveArrCaller(this, {arr:arr, owner:owner, id:id, props:props}).request();
    }

    async posArr(arr:string, owner:number, id:number, order:number) {
        //return await this.uqApi.tuidArrPos(this.name, arr, owner, id, order);
        return await new ArrPosCaller(this, {arr:arr, owner:owner, id:id, order:order}).request();
    }
}

export class TuidMain extends Tuid {
    get Main() { return this }

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

abstract class TuidCaller<T> extends EntityCaller<T> {
    protected get entity(): Tuid {return this._entity as Tuid};
}

// 包含main字段的load id
// 当前为了兼容，先调用的包含所有字段的内容
class GetCaller extends TuidCaller<number> {
    method = 'GET';
    get path():string {return `tuid/${this.entity.name}/${this.params}`}
}

class IdsCaller extends TuidCaller<{divName:string, ids:number[]}> {
    get path():string {
        let {divName} = this.params;
        return `tuidids/${this.entity.name}/${divName !== undefined?divName:'$'}`;
    }
    buildParams():any {return this.params.ids}
    xresult(res:any):any {
        return (res as string).split('\n');
    }
}


class SaveCaller extends TuidCaller<{id:number, props:any}> {
    get path():string {return `tuid/${this.entity.name}`}
    buildParams():any {
        let {fields, arrFields} = this.entity;
        let {id, props} = this.params;
        let params:any = {$id: id};
        this.transParams(params, props, fields);
        if (arrFields !== undefined) {
            for (let arr of arrFields) {
                let arrName = arr.name;
                let arrParams = [];
                let arrFields = arr.fields;
                let arrValues = props[arrName];
                if (arrValues !== undefined) {
                    for (let arrValue of arrValues) {
                        let row = {};
                        this.transParams(row, arrValue, arrFields);
                        arrParams.push(row);
                    }
                }
                params[arrName] = arrParams;
            }
        }
        return params;
    }
    private transParams(values:any, params:any, fields:Field[]) {
        if (params === undefined) return;
        for (let field of fields) {
            let {name, tuid, type} = field;
            let val = params[name];
            if (tuid !== undefined) {
                if (typeof val === 'object') {
                    if (val !== null) val = val.id;
                }
            }
            else {
                switch (type) {
                    case 'date':
                        val = this.entity.buildDateParam(val); 
                        //val = (val as string).replace('T', ' ');
                        //val = (val as string).replace('Z', '');
                        break;
                    case 'datetime':
                        val = this.entity.buildDateTimeParam(val);
                        //val = new Date(val).toISOString();
                        //val = (val as string).replace('T', ' ');
                        //val = (val as string).replace('Z', '');
                        break;
                }
            }
            values[name] = val;
        }
    }
}

class SearchCaller extends TuidCaller<{arr:string, owner:number, key:string, pageStart:string|number, pageSize:number}> {
    get path():string {return `tuids/${this.entity.name}`}
}

class AllCaller extends TuidCaller<{}> {
    method = 'GET';
    get path():string {return `tuid-all/${this.entity.name}`}
}

class LoadArrCaller extends TuidCaller<{arr:string, owner:number, id:number}> {
    method = 'GET';
    get path():string {
        let {arr, owner, id} = this.params;
        return `tuid-arr/${this.entity.name}/${owner}/${arr}/${id}`;
    }
}

class SaveArrCaller extends TuidCaller<{arr:string, owner:number, id:number, props:any}> {
    get path():string {
        let {arr, owner} = this.params;
        return `tuid-arr/${this.entity.name}/${owner}/${arr}/`;
    }
    buildParams():any {
        let {id, props} = this.params;
        let params = _.clone(props);
        params['$id'] = id;
        return params;
    }
}

class ArrPosCaller extends TuidCaller<{arr:string, owner:number, id:number, order:number}> {
    get path():string {
        let {arr, owner} = this.params;
        return `tuid-arr-pos/${this.entity.name}/${owner}/${arr}/`;
    }
    buildParams():any {
        let {id, order} = this.params;
        return { bid: id, $order: order}
    }
}
