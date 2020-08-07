"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const express_1 = require("express");
//import { Runner, getRunner } from '../../db';
//import { consts } from '../../core';
//import { writeDataToBus } from '../../queue/processBusMessage';
const getIp_1 = require("./getIp");
const busPage_1 = require("./busPage");
const busExchange_1 = require("./busExchange");
function createRouter(settings) {
    let router = express_1.Router({ mergeParams: true });
    router.get('/', async (req, res) => {
        await routerProcess(req, res, busPage_1.busPage);
    });
    router.post('/', async (req, res) => {
        await routerProcess(req, res, busExchange_1.busExchange);
    });
    async function routerProcess(req, res, action) {
        try {
            let reqIP = getIp_1.getClientIp(req);
            let innerIP = getIp_1.getIp(req);
            let netIP = getIp_1.getNetIp(req);
            if (getIp_1.validIp(settings.allowedIP, [innerIP, netIP]) === false) {
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
exports.createRouter = createRouter;
//# sourceMappingURL=router.js.map