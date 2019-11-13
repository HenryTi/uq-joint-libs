"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../db/mysql/database");
const tool_1 = require("../db/mysql/tool");
async function createMapTable(moniker) {
    moniker = moniker.toLowerCase();
    let sql = `
    create table if not exists \`${database_1.databaseName}\`.\`map_${moniker}\` (
        id bigint not null,
        no varchar(50) not null,
        primary key(id),
        unique index no_idx(no)
    );
    `;
    await tool_1.execSql(sql);
}
exports.createMapTable = createMapTable;
//# sourceMappingURL=createMapTable.js.map