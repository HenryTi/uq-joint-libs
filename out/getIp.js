"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getClientIp(req) {
    return req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
}
exports.getClientIp = getClientIp;
;
function getIp(_http) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = ipStr.split(",");
        if (ipArray || ipArray.length > 0) {
            //如果获取到的为ip数组
            return ipArray[0];
        }
    }
    else {
        //获取不到时
        return _http.ip.substring(_http.ip.lastIndexOf(":") + 1);
    }
}
exports.getIp = getIp;
;
function getNetIp(_http) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = ipStr.split(",");
        if (ipArray.length > 1) {
            //如果获取到的为ip数组
            for (var i = 0; i < ipArray.length; i++) {
                var ipNumArray = ipArray[i].split(".");
                var tmp = ipNumArray[0] + "." + ipNumArray[1];
                if (tmp == "192.168" ||
                    (ipNumArray[0] == "172" && Number(ipNumArray[1]) >= 16 && Number(ipNumArray[1]) <= 32) || tmp == "10.7") {
                    continue;
                }
                return ipArray[i];
            }
        }
        return ipArray[0];
    }
    else {
        //获取不到时
        return _http.ip.substring(_http.ip.lastIndexOf(":") + 1);
    }
}
exports.getNetIp = getNetIp;
;
const myIps = ['1', '::1', '127.0.0.1', '::ffff:127.0.0.1'];
function validIp(regIp, ips) {
    if (typeof regIp === 'string')
        regIp = [regIp];
    for (let ri of regIp) {
        for (let ip of ips) {
            if (myIps.find(v => v === ip) !== undefined)
                return true;
            if (ip === ri)
                return true;
        }
    }
    return false;
}
exports.validIp = validIp;
//# sourceMappingURL=getIp.js.map