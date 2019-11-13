import {Router, Request, Response, NextFunction} from 'express';
//import { Runner, getRunner } from '../../db';
//import { consts } from '../../core';
//import { writeDataToBus } from '../../queue/processBusMessage';
import { getClientIp, getIp, getNetIp, validIp } from './getIp';
import { busPage } from './busPage';
import { busExchange } from './busExchange';
import { Settings } from './defines';

export function createRouter(settings: Settings):Router {
    let router: Router = Router({ mergeParams: true });

    router.get('/', async (req: Request, res: Response) => {
        await routerProcess(req, res, busPage);
    });

    router.post('/', async (req: Request, res: Response) => {
        await routerProcess(req, res, busExchange);
    });

    async function routerProcess(req: Request, res: Response, 
        action: (req: Request, res: Response) => Promise<void>) 
    {
        try {
            let reqIP = getClientIp(req);
            let innerIP = getIp(req);
            let netIP = getNetIp(req);
            if (validIp(settings.allowedIP, [innerIP, netIP]) === false) {
                res.end('<div>Your IP ' + (netIP || innerIP || reqIP) + ' is not valid!</div>');
                return;
            }
            await action(req, res);
        }
        catch (err) {
            res.end('error: ' + err.message);
        }
    }
    return router;
}
