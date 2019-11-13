"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tool_1 = require("./db/mysql/tool");
const database_1 = require("./db/mysql/database");
let lastHour;
;
async function busExchange(req, res) {
    let tickets = req.body;
    if (Array.isArray(tickets) === false)
        tickets = [tickets];
    let ret = [];
    let hour = Math.floor(Date.now() / (3600 * 1000));
    if (lastHour === undefined || hour > lastHour) {
        let inc = hour * 1000000000;
        await tool_1.execSql(database_1.alterTableIncrement('queue_out', inc));
        await tool_1.execSql(database_1.alterTableIncrement('queue_in', inc));
        lastHour = hour;
    }
    for (let ticket of tickets) {
        let { moniker, queue, data } = ticket;
        if (moniker === undefined)
            continue;
        if (data !== undefined) {
            await tool_1.execProc('write_queue_in', [moniker, JSON.stringify(data)]);
        }
        else {
            let q = Number(queue);
            if (Number.isNaN(q) === false) {
                let readQueue = await tool_1.tableFromProc('read_queue_out', [moniker, q]);
                if (readQueue.length > 0) {
                    ret.push(readQueue[0]);
                }
            }
        }
    }
    res.json(ret);
}
exports.busExchange = busExchange;
//# sourceMappingURL=busExchange.js.map