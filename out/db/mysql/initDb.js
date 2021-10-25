"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const database_1 = require("./database");
const tables_1 = require("./tables");
const procs_1 = require("./procs");
const tool_1 = require("./tool");
//import {buildRoot} from './buildRoot';
async function init() {
    let tbl = await tool_1.tableFromSql(database_1.existsDatabase);
    let exists = tbl[0];
    if (exists !== undefined) {
        console.log('Database already exists. Nothing to do this time.');
        return;
    }
    console.log('Start init database %s.', database_1.databaseName);
    await tool_1.execSql(database_1.createDatabase);
    await tool_1.execSql(database_1.useDatabase);
    console.log('Database %s created.', database_1.databaseName);
    for (let i in tables_1.tableDefs) {
        let tbl = tables_1.tableDefs[i];
        let sql = tool_1.buildTableSql(tbl);
        await tool_1.execSql(sql).then(v => {
            console.log('succeed: ' + tbl.name);
        }).catch(reason => {
            console.log('error: ' + tbl.name);
            console.log(reason);
        });
    }
    for (let i in procs_1.procDefs) {
        let proc = procs_1.procDefs[i];
        console.log('CREATE PROCEDURE ' + proc.name);
        let sql = tool_1.buildProcedureSql(proc);
        await tool_1.execSql(sql).then(v => {
        }).catch(reason => {
            console.log(reason);
        });
    }
}
exports.init = init;
//# sourceMappingURL=initDb.js.map