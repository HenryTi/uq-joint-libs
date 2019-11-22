"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uqApi_1 = require("../tool/uqApi");
class EntityCaller extends uqApi_1.Caller {
    constructor(entity, params, waiting = true) {
        super(params, waiting);
        this.tries = 0;
        this._entity = entity;
    }
    get entity() { return this._entity; }
    //大多的entityCaller都不需要这个
    //buildParams() {return this.entity.buildParams(this.params);}
    async request() {
        await this.entity.loadSchema();
        let ret = await this.innerRequest();
        return ret;
    }
    async innerCall() {
        return await this.entity.uq.uqApi.xcall(this);
    }
    async innerRequest() {
        let jsonResult = await this.innerCall();
        let { $uq, $modify, res } = jsonResult;
        // this.entity.uq.pullModify($modify); tuidsCache 在服务器端没有使用
        if ($uq === undefined) {
            //if (res === undefined) debugger;
            let ret = this.xresult(res);
            //if (ret === undefined) debugger;
            return ret;
        }
        return await this.retry($uq);
    }
    xresult(res) { return res; }
    get headers() {
        let { ver, uq } = this.entity;
        let { uqVersion } = uq;
        return {
            uq: `${uqVersion}`,
            en: `${ver}`,
        };
    }
    async retry(schema) {
        ++this.tries;
        if (this.tries > 5)
            throw new Error('can not get right uq response schema, 5 tries');
        this.rebuildSchema(schema);
        return await this.innerRequest();
    }
    rebuildSchema(schema) {
        let { uq, entity } = schema;
        if (uq !== undefined)
            this.entity.uq.buildEntities(uq);
        if (entity !== undefined)
            this.entity.setSchema(entity);
    }
}
exports.EntityCaller = EntityCaller;
class ActionCaller extends EntityCaller {
    get entity() { return this._entity; }
}
exports.ActionCaller = ActionCaller;
class QueryQueryCaller extends EntityCaller {
    get entity() { return this._entity; }
    ;
    get path() { return `query/${this.entity.name}`; }
    xresult(res) {
        let data = this.entity.unpackReturns(res);
        return data;
    }
    buildParams() { return this.entity.buildParams(this.params); }
}
exports.QueryQueryCaller = QueryQueryCaller;
class QueryPageCaller extends EntityCaller {
    get params() { return this._params; }
    ;
    get entity() { return this._entity; }
    ;
    get path() { return `query-page/${this.entity.name}`; }
    buildParams() {
        let { pageStart, pageSize, params } = this.params;
        let p;
        if (params === undefined) {
            p = { key: '' };
        }
        else {
            p = this.entity.buildParams(params);
        }
        /*
        switch (typeof params) {
            case 'undefined': p = {key: ''}; break;
            default: p = _.clone(params); break;
        }
        */
        p['$pageStart'] = pageStart;
        p['$pageSize'] = pageSize;
        return p;
    }
    ;
    xresult(res) {
        let data = this.entity.unpackReturns(res);
        return data.$page; // as any[];
    }
}
exports.QueryPageCaller = QueryPageCaller;
//# sourceMappingURL=caller.js.map