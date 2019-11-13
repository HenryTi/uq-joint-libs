/*
import fetch, {Headers} from 'node-fetch';
import config from 'config';

export const isDevelopment = process.env.NODE_ENV === 'development';

const centerHost = config.get<string>('centerhost');
const centerDebugHost = 'localhost:3000'; //'192.168.86.64';

const uqDebugHost = 'localhost:3015'; //'192.168.86.63';
const debugUqBuilder = 'localhost:3009';
interface HostValue {
    value: string;
    local: boolean;
}

function tryConfig<T>(name:string):T {
    if (config.has(name) === false) return;
    return config.get<T>(name);
}

const hosts:{[name:string]:HostValue} = {
    centerhost: {
        value: tryConfig<string>('debug-centerhost') || centerDebugHost,
        local: false
    },
    uqhost: {
        value: tryConfig<string>('debug-uqhost') || uqDebugHost,
        local: false
    },
    unitxhost: {
        value: tryConfig<string>('debug-unitxhost') || uqDebugHost,
        local: false
    },
    "uq-build": {
        value: tryConfig<string>('debug-uq-serverhost')  || debugUqBuilder,
        local: false
    }
}

function centerUrlFromHost(host:string) {return `http://${host}/tv/`}
function centerWsFromHost(host:string) {return `ws://${host}/tv/`}
    
class Host {
    centerUrl: string;
    //ws: string;

    async start() {
        if (isDevelopment === true) {
            await this.tryLocal();
        }
        let host = this.getCenterHost();
        this.centerUrl = centerUrlFromHost(host);
        //this.ws = centerWsFromHost(host);
    }

    private debugHostUrl(host:string) {return `http://${host}/hello`}
    private async tryLocal() {
        let promises:PromiseLike<any>[] = [];
        for (let i in hosts) {
            let hostValue = hosts[i];
            let {value} = hostValue;
            //let host = process.env[env] || value;
            let fetchUrl = this.debugHostUrl(value);
            let fetchOptions = {
                method: "GET",
                mode: "no-cors", // no-cors, cors, *same-origin
                headers: {
                    "Content-Type": "text/plain"
                },
            };
            promises.push(localCheck(fetchUrl, fetchOptions));
        }
        let results = await Promise.all(promises);
        let p = 0;
        for (let i in hosts) {
            let hostValue = hosts[i];
            hostValue.local = results[p];
            ++p;
        }
    }

    private getCenterHost():string {
        let {value, local} = hosts.centerhost;
        if (isDevelopment === true) {
            if (local === true) return value;
        }
        return centerHost;
    }

    getUrlOrDebug(url:string, urlDebug:string):string {
        if (isDevelopment !== true) return url;
        if (!urlDebug) return url;
        for (let i in hosts) {
            let host = hosts[i];
            let {value, local} = host;
            let hostString = `://${i}/`;
            let pos = urlDebug.indexOf(hostString);
            if (pos > 0) {
                if (local === false) break;
                urlDebug = urlDebug.replace(hostString, `://${value}/`);
                return urlDebug;
            }
        }
        return url;
    }
}

export const host:Host = new Host();

// 因为测试的都是局域网服务器，甚至本机服务器，所以一秒足够了
// 网上找了上面的fetch timeout代码。
// 尽管timeout了，fetch仍然继续，没有cancel

// 实际上，一秒钟不够。web服务器会自动停。重启的时候，可能会比较长时间。也许两秒甚至更多。
//const timeout = 2000;
const timeout = 100;

function fetchLocalCheck(url:string, options?:any):Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(url, options)
      .then(v => {
          v.text().then(resolve).catch(reject);
      })
      .catch(reject);
      const e = new Error("Connection timed out");
      setTimeout(reject, timeout, e);
    });
}

async function localCheck(url:string, options?:any):Promise<boolean> {
    try {
        await fetchLocalCheck(url, options);
        return true;
    }
    catch {
        return false;
    }
}
*/ 
//# sourceMappingURL=host.0.js.map