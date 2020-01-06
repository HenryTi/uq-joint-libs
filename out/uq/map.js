"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entity_1 = require("./entity");
const action_1 = require("./action");
const caller_1 = require("./caller");
class Map extends entity_1.Entity {
    constructor() {
        super(...arguments);
        this.actions = {};
        this.queries = {};
    }
    get typeName() { return 'map'; }
    setSchema(schema) {
        super.setSchema(schema);
        this.schemaFrom = this.schema.from;
        let { actions, queries, keys } = schema;
        this.uq.buildFieldTuid(this.keys = keys);
        //let t = this.schemaStringify();
        for (let i in actions) {
            let actionSchema = actions[i];
            let { name } = actionSchema;
            let action = this.uq.newAction(name, undefined);
            action.setSchema(actionSchema);
            //action.buildFieldsTuid();
            this.actions[i] = action;
        }
        for (let i in queries) {
            let querySchema = queries[i];
            let { name } = querySchema;
            let query = this.uq.newQuery(name, undefined);
            query.setSchema(querySchema);
            //query.buildFieldsTuid();
            this.queries[i] = query;
        }
    }
    async add(param) {
        /*
        await this.loadSchema();
        return await this.actions.add.submit(param);
        */
        let ret = await new AddCaller(this, param).request();
        return ret;
    }
    async del(param) {
        /*
        await this.loadSchema();
        return await this.actions.del.submit(param);
        */
        let ret = await new DelCaller(this, param).request();
        return ret;
    }
    async all() {
        /*
        await this.loadSchema();
        return await this.queries.all.query({});
        */
        let ret = await new AllCaller(this, undefined).request();
        return ret;
    }
    async page(param, pageStart, pageSize) {
        /*
        await this.loadSchema();
        return await this.queries.page.page(param, pageStart, pageSize);
        */
        let ret = await new PageCaller(this, { pageStart: pageStart, pageSize: pageSize, param: param }).request();
        return ret;
    }
    async query(param) {
        /*
        await this.loadSchema();
        return await this.queries.query.query(param);
        */
        let qc = new QueryCaller(this, param);
        let ret = await qc.request();
        return ret;
    }
    async table(params) {
        let ret = await this.query(params);
        for (let i in ret) {
            return ret[i];
        }
    }
    async obj(params) {
        let ret = await this.table(params);
        if (ret.length > 0)
            return ret[0];
    }
    async scalar(params) {
        let ret = await this.obj(params);
        for (let i in ret)
            return ret[i];
    }
}
exports.Map = Map;
class MapCaller extends caller_1.EntityCaller {
    get entity() { return this._entity; }
    get path() { return undefined; }
    async innerCall() {
        let caller = this.getCaller(this.params);
        let p = caller.buildParams();
        console.log('MapCaller', p);
        debugger;
        let res = await this.entity.uq.uqApi.xcall(caller);
        let ret = caller.xresult(res.res);
        return { res: ret };
    }
    buildParams() {
        let p = super.buildParams();
        return p;
    }
}
class AddCaller extends MapCaller {
    getCaller(param) {
        return new MapAddCaller(this.entity, this.entity.actions.add, param);
    }
}
class DelCaller extends MapCaller {
    getCaller(param) {
        return new MapDelCaller(this.entity, this.entity.actions.add, param);
    }
}
class AllCaller extends MapCaller {
    getCaller(param) {
        return new MapAllCaller(this.entity, this.entity.queries.all, param);
    }
}
class PageCaller extends MapCaller {
    getCaller(param) {
        return new MapPageCaller(this.entity, this.entity.queries.page, param);
    }
}
class QueryCaller extends MapCaller {
    getCaller(param) {
        return new MapQueryCaller(this.entity, this.entity.queries.query, param);
    }
}
class MapAddCaller extends action_1.ActionSubmitCaller {
    constructor(map, action, params) {
        super(action, params);
        this.map = map;
    }
    get path() { return `map/${this.map.name}/add`; }
    get headers() { return undefined; }
}
class MapDelCaller extends action_1.ActionSubmitCaller {
    constructor(map, action, params) {
        super(action, params);
        this.map = map;
    }
    get path() { return `map/${this.map.name}/del`; }
    get headers() { return undefined; }
}
class MapAllCaller extends caller_1.QueryPageCaller {
    constructor(map, query, params) {
        super(query, params);
        this.map = map;
    }
    get path() { return `map/${this.map.name}/all`; }
    get headers() { return undefined; }
}
class MapPageCaller extends caller_1.QueryPageCaller {
    constructor(map, query, params) {
        super(query, params);
        this.map = map;
    }
    get path() { return `map/${this.map.name}/page`; }
    get headers() { return undefined; }
}
class MapQueryCaller extends caller_1.QueryQueryCaller {
    constructor(map, query, params) {
        super(query, params);
        this.map = map;
    }
    get path() { return `map/${this.map.name}/query`; }
    get headers() { return undefined; }
}
//# sourceMappingURL=map.js.map