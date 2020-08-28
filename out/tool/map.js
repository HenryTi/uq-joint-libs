"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
const tool_1 = require("../db/mysql/tool");
const database_1 = require("../db/mysql/database");
const createMapTable_1 = require("./createMapTable");
/**
 * 建立实体在tonva和老系统内id的对应关系
 * @param moniker 实体名称
 * @param id 在tonva中的id
 * @param no 在老系统中的id
 */
async function map(moniker, id, no) {
    moniker = moniker.toLowerCase();
    let sql = `
        insert into \`${database_1.databaseName}\`.\`map_${moniker}\` (id, no) values (${id}, '${no}');
    `;
    // on duplicate key update id=${id};
    try {
        await tool_1.execSql(sql);
    }
    catch (err) {
        await createMapTable_1.createMapTable(moniker);
        await tool_1.execSql(sql);
    }
}
exports.map = map;
//# sourceMappingURL=map.js.map