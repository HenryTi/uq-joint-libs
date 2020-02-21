import { execSql } from "../db/mysql/tool";
import { databaseName } from "../db/mysql/database";
import { createMapTable } from "./createMapTable";

/**
 * 建立实体在tonva和老系统内id的对应关系
 * @param moniker 实体名称
 * @param id 在tonva中的id
 * @param no 在老系统中的id
 */
export async function map(moniker: string, id: number, no: string) {
    moniker = moniker.toLowerCase();
    let sql = `
        insert into \`${databaseName}\`.\`map_${moniker}\` (id, no) values (${id}, '${no}');
    `;
	// on duplicate key update id=${id};

    try {
        await execSql(sql);
    }
    catch (err) {
        await createMapTable(moniker);
        await execSql(sql);
    }
}
