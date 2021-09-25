import { Request, Response } from "express";
import { tableFromProc, execSql } from "./db/mysql/tool";
import { alterTableIncrement } from "./db/mysql/database";

let lastHour: number;

interface Ticket {
    moniker: string;
    queue: number;
    data: string;
};
export async function busExchange(req: Request, res: Response) {
    let tickets: Ticket[] = req.body;
    if (Array.isArray(tickets) === false) tickets = [tickets as any];

    let ret: { moniker: string, queue: number, data: any }[] = [];
    let hour = Math.floor(Date.now() / (3600 * 1000));
    if (lastHour === undefined || hour > lastHour) {
        let inc = hour * 1000000000;
        await execSql(alterTableIncrement('queue_out', inc));
        await execSql(alterTableIncrement('queue_in', inc));
        lastHour = hour;
    }
    for (let ticket of tickets) {
        let { moniker, queue, data } = ticket;
        if (moniker === undefined) continue;
        if (data !== undefined) {
            let queueInId = await tableFromProc('write_queue_in', [moniker, JSON.stringify(data)]);
            ret.push({ moniker: moniker, queue: queueInId[0].id, data: undefined });
        }
        else {
            let q = Number(queue);
            if (Number.isNaN(q) === false) {
                let readQueue = await tableFromProc('read_queue_out', [moniker, q]);
                if (readQueue.length > 0) {
                    ret.push(readQueue[0]);
                }
            }
        }
    }
    res.json(ret);
}
