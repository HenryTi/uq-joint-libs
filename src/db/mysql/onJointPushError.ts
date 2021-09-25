import { databaseName } from "./database";
import { execSql } from "./tool";

export async function onJointPushError(failedId: number, reason: string): Promise<void> {
    try {
        if (typeof failedId === 'number') {
            let sql = `insert into \`${databaseName}\`.queue_in_failed(id, reason) 
            values(${failedId}, '${reason}') on duplicate key update reason = values(reason), date = CURRENT_TIMESTAMP;`;
            await execSql(sql);
        }
    }
    catch (err) {
        throw err;
    }
}