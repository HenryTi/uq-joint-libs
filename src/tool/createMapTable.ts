import { databaseName } from "../db/mysql/database";
import { execSql } from "../db/mysql/tool";

export async function createMapTable(moniker: string): Promise<void> {
    moniker = moniker.toLowerCase();
    let sql = `
    create table if not exists \`${databaseName}\`.\`map_${moniker}\` (
        id bigint not null,
        no varchar(50) not null,
        primary key(id),
        unique index no_idx(no)
    );
    `;
    await execSql(sql);
}