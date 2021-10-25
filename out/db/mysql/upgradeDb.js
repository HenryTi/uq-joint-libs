"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgrade = void 0;
const database_1 = require("./database");
const tables_1 = require("./tables");
const procs_1 = require("./procs");
const tool_1 = require("./tool");
//import {buildRoot} from './buildRoot';
async function upgrade() {
    let sqlExists = database_1.existsDatabase;
    let tbl = await tool_1.tableFromSql(sqlExists);
    let exists = tbl[0];
    if (exists === undefined) {
        await tool_1.execSql(database_1.createDatabase);
        tbl = await tool_1.tableFromSql(sqlExists);
        if (tbl.length === 0) {
            console.log('Database not inited. Nothing to do this time.');
            return;
        }
    }
    console.log('Start upgrade database %s', database_1.databaseName);
    await tool_1.execSql(database_1.useDatabase);
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
        let pName = proc.name;
        let procType = proc.returns === undefined ? 'PROCEDURE' : 'FUNCTION';
        console.log('CREATE ' + procType + ' ' + pName);
        let drop = 'DROP ' + procType + ' IF EXISTS ' + pName;
        await tool_1.execSql(drop);
        let sql = tool_1.buildProcedureSql(proc);
        await tool_1.execSql(sql).then(v => {
        }).catch(reason => {
            console.log(reason);
        });
    }
    //await buildRoot();
}
exports.upgrade = upgrade;
//# sourceMappingURL=upgradeDb.js.map