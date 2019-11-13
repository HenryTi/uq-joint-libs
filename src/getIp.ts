import { Request } from "express";

export function getClientIp(req:Request) {
    return req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
};

export function getIp(_http:Request) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = (ipStr as string).split(",");
        if (ipArray || ipArray.length > 0) {
            //如果获取到的为ip数组
            return ipArray[0];
        }
    }
    else {
        //获取不到时
        return _http.ip.substring(_http.ip.lastIndexOf(":") + 1);
    }
};

export function getNetIp(_http: Request) {
    var ipStr = _http.headers['X-Real-IP'] || _http.headers['x-forwarded-for'];
    if (ipStr) {
        var ipArray = (ipStr as string).split(",");
        if (ipArray.length > 1) {
            //如果获取到的为ip数组
            for (var i = 0; i < ipArray.length; i++) {
                var ipNumArray = ipArray[i].split(".");
                var tmp = ipNumArray[0] + "." + ipNumArray[1];
                if (tmp == "192.168" || 
                    (ipNumArray[0] == "172" && Number(ipNumArray[1]) >= 16 && Number(ipNumArray[1]) <= 32) || tmp == "10.7")
                {
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
};

const myIps:string[] = ['1', '::1', '127.0.0.1', '::ffff:127.0.0.1'];
export function validIp(regIp:string|string[], ips:string[]):boolean {
    if (typeof regIp === 'string') regIp = [regIp];
    for (let ri of regIp) {
        for (let ip of ips) {
            if (myIps.find(v => v === ip) !== undefined) return true;
            if (ip === ri) return true;
        }
    }
    return false;
}

