import { databaseName } from "./database";
import { execSql } from "./tool";

export async function onJointPushError(failedId: number): Promise<void> {
    try {
        if (typeof failedId === 'number') {
            let sql = `insert into \`${databaseName}\`.queue_in_failed(id) values(${failedId}) on duplicate key update date = CURRENT_TIMESTAMP;`;
            await execSql(sql);
        }
    }
    catch (err) {
        throw err;
    }
}