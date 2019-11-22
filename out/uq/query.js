"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import _ from 'lodash';
//import {Field, ArrFields} from './uq';
const entity_1 = require("./entity");
const caller_1 = require("./caller");
/*
export class QueryPager<T extends any> extends PageItems<T> {
    private query: Query;
    constructor(query: Query, pageSize?: number, firstSize?: number) {
        super();
        this.query = query;
        if (pageSize !== undefined) this.pageSize = pageSize;
        if (firstSize !== undefined) this.firstSize = firstSize;
    }

    protected async onLoad() {
        let {schema} = this.query;
        if (schema === undefined) await this.query.loadSchema();
    }

    protected async load(param:any, pageStart:any, pageSize:number):Promise<T[]> {
        if (pageStart === undefined) pageStart = 0;
        let ret = await this.query.page(param, pageStart, pageSize);
        return ret;
    }
    protected setPageStart(item:T) {
        let {schema} = this.query;
        if (schema === undefined) return;
        let $page = (schema.returns as any[]).find(v => v.name === '$page');
        if ($page === undefined) return;
        let {order} = $page;
        if (order === undefined) return;
        let {field, type, asc} = order;
        let start:any;
        if (item !== undefined) start = item[field];
        if (asc === false) {
            this.appendPosition = 'head';
            switch (type) {
                default:
                case 'tinyint':
                case 'smallint':
                case 'int':
                case 'bigint':
                case 'dec': start = 999999999999; break;
                case 'date':
                case 'datetime': start = undefined; break;          // 会自动使用现在
                case 'char': start = ''; break;
            }
        }
        else {
            this.appendPosition = 'tail';
            switch (type) {
                default:
                case 'tinyint':
                case 'smallint':
                case 'int':
                case 'bigint':
                case 'dec': start = 0; break;
                case 'date':
                case 'datetime': start = '1970-1-1'; break;
                case 'char': start = ''; break;
            }
        }
        this.pageStart = start;
    }
}
*/
class Query extends entity_1.Entity {
    get typeName() { return 'query'; }
    setSchema(schema) {
        super.setSchema(schema);
        let { returns } = schema;
        //this.returns = returns;
        this.isPaged = returns && returns.find(v => v.name === '$page') !== undefined;
    }
    resetPage(size, params) {
        this.pageStart = undefined;
        this.pageSize = size;
        this.params = params;
        this.more = false;
        //this.list = undefined;
    }
    get hasMore() { return this.more; }
    async loadPage() {
        if (this.pageSize === undefined) {
            throw new Error('call resetPage(size:number, params:any) first');
        }
        let pageStart;
        if (this.pageStart !== undefined) {
            switch (this.startField.type) {
                default:
                    pageStart = this.pageStart;
                    break;
                case 'date':
                case 'time':
                case 'datetime':
                    pageStart = this.pageStart.getTime();
                    break;
            }
        }
        let page = await this.page(this.params, pageStart, this.pageSize + 1);
        /*
        await this.loadSchema();
        let res = await this.tvApi.page(this.name, pageStart, this.pageSize+1, this.params);
        let data = await this.unpackReturns(res);
        let page = data['$page'] as any[];
        */
        //this.list = observable.array([], {deep: false});
        if (page !== undefined) {
            if (page.length > this.pageSize) {
                this.more = true;
                page.pop();
                let ret = this.returns.find(r => r.name === '$page');
                this.startField = ret.fields[0];
                this.pageStart = page[page.length - 1][this.startField.name];
            }
            else {
                this.more = false;
            }
            //this.list.push(...page);
        }
        //this.loaded = true;
    }
    pageCaller(params, showWaiting = true) {
        return new caller_1.QueryPageCaller(this, params, showWaiting);
    }
    async page(params, pageStart, pageSize, showWaiting = true) {
        /*
        await this.loadSchema();
        let res = await this.uqApi.page(this.name, pageStart, pageSize+1, this.buildParams(params));
        */
        let p = { pageStart: pageStart, pageSize: pageSize + 1, params: params };
        let res = await this.pageCaller(p, showWaiting).request();
        //let data = this.unpackReturns(res);
        //return data.$page;// as any[];
        return res;
    }
    queryCaller(params, showWaiting = true) {
        return new caller_1.QueryQueryCaller(this, params, showWaiting);
    }
    async query(params, showWaiting = true) {
        /*
        await this.loadSchema();
        let res = await this.uqApi.query(this.name, this.buildParams(params));
        */
        let res = await this.queryCaller(params, showWaiting).request();
        //let data = this.unpackReturns(res);
        //return data;
        return res;
    }
    async table(params, showWaiting = true) {
        let ret = await this.query(params, showWaiting);
        for (let i in ret) {
            return ret[i];
        }
    }
    async obj(params, showWaiting = true) {
        let ret = await this.table(params, showWaiting);
        if (ret.length > 0)
            return ret[0];
    }
    async scalar(params, showWaiting = true) {
        let ret = await this.obj(params, showWaiting);
        for (let i in ret)
            return ret[i];
    }
}
exports.Query = Query;
//# sourceMappingURL=query.js.map