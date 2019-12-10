import fetch from 'node-fetch';
import config from 'config';
import { centerApi } from './centerApi';

// export const isDevelopment = process.env.NODE_ENV === 'development';
export const isDevelopment = process.env.NODE_ENV !== 'production';
function tryConfig<T>(name: string): T {
    if (config.has(name) === false) return;
    return config.get<T>(name);
}

const centerHost = tryConfig<string>('centerhost');
const uqPath = tryConfig<string>('uqPath');
const uqUnitxPath = tryConfig<string>('uqUnitxPath');
const centerDebugHost = 'localhost:3000'; //'192.168.86.64';

//const resHost = process.env['REACT_APP_RES_HOST'] || centerHost;
const resDebugHost = 'localhost:3015'; //'192.168.86.63';

const uqDebugHost = 'localhost:3015'; //'192.168.86.63';
const uqDebugBuilderHost = 'localhost:3009';

interface HostValue {
    value: string;
    local: boolean;
}
const hosts: { [name: string]: HostValue } = {
    centerhost: {
        value: tryConfig('debug-center-host') || centerDebugHost,
        local: false
    },
    reshost: {
        value: tryConfig('debug-res-host') || resDebugHost,
        local: false
    },
    uqhost: {
        value: tryConfig('debug-uq-host') || uqDebugHost,
        local: false
    },
    unitxhost: {
        value: tryConfig('debug-unitx-host') || uqDebugHost,
        local: false
    },
    "uq-build": {
        value: tryConfig('debug-uq-build-host') || uqDebugBuilderHost,
        local: false
    }
}

function centerUrlFromHost(host: string) {
    if (host.startsWith('https://') === true) {
        if (host.endsWith('/')) host = host.substr(0, host.length - 1);
        return host + '/tv/';
    }
    return `http://${host}/tv/`;
}
function centerWsFromHost(host: string) {
    let https = 'https://';
    if (host.startsWith(https) === true) {
        host = host.substr(https.length);
        if (host.endsWith('/') === true) host = host.substr(0, host.length - 1);
        return 'wss://' + host + '/tv/';
    }
    return `ws://${host}/tv/`
}

const fetchOptions = {
    method: "GET",
    mode: "no-cors", // no-cors, cors, *same-origin
    headers: {
        "Content-Type": "text/plain"
    },
};

class Host {

    /**
     * 是中心服务器的起始baseurl
     */
    centerUrl: string;
    ws: string;
    resHost: string;

    async start() {
        if (isDevelopment === true) {
            await this.tryLocal();
        }
        let host = this.getCenterHost();
        this.centerUrl = centerUrlFromHost(host);
        this.ws = centerWsFromHost(host);
        this.resHost = this.getResHost();
        centerApi.initBaseUrl(this.centerUrl);
    }

    private debugHostUrl(host: string) { return `http://${host}/hello` }
    private async tryLocal() {
        let promises: PromiseLike<any>[] = [];
        let hostArr: string[] = [];
        for (let i in hosts) {
            let hostValue = hosts[i];
            let { value } = hostValue;
            if (hostArr.findIndex(v => v === value) < 0) hostArr.push(value);
        }

        for (let host of hostArr) {
            let fetchUrl = this.debugHostUrl(host);
            promises.push(localCheck(fetchUrl));
        }
        let results = await Promise.all(promises);
        let len = hostArr.length;
        for (let i = 0; i < len; i++) {
            let local = results[i];
            let host = hostArr[i];
            for (let j in hosts) {
                let hostValue = hosts[j];
                if (hostValue.value === host) {
                    hostValue.local = local;
                }
            }
        }
        /*
        let p = 0;
        for (let i in hosts) {
            let hostValue = hosts[i];
            hostValue.local = results[p];
            ++p;
        }
        */
    }

    private getCenterHost(): string {
        let { value, local } = hosts.centerhost;
        if (isDevelopment === true) {
            if (local === true) return value;
        }
        return centerHost;
    }

    private getResHost(): string {
        let { value, local } = hosts.reshost;
        if (isDevelopment === true) {
            if (local === true) return value;
        }
        return this.resHost;
    }

    getUrlOrDebug(url: string, debugHost: string = 'uqhost'): string {
        if (isDevelopment === false) return url;
        let host = hosts[debugHost];
        if (host === undefined) return url;
        let { value, local } = host;
        if (local === false) return url;
        return `http://${value}/`;
    }
    getUrlOrTest(db: string, url: string, urlTest: string): string {
        let path: string = db === '$unitx'? uqUnitxPath : uqPath + db + '/';
        if (isDevelopment === true) {
            if (urlTest && urlTest !== '-') url = urlTest;
        }
        url = this.getUrlOrDebug(url);
        return url + path;
    }

    async localCheck(urlDebug: string): Promise<boolean> {
        return await localCheck(urlDebug);
    }
}

export const host: Host = new Host();

// 因为测试的都是局域网服务器，甚至本机服务器，所以一秒足够了
// 网上找了上面的fetch timeout代码。
// 尽管timeout了，fetch仍然继续，没有cancel

// 实际上，一秒钟不够。web服务器会自动停。重启的时候，可能会比较长时间。也许两秒甚至更多。
//const timeout = 2000;
const timeout = 200;

function fetchLocalCheck(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fetch(url, fetchOptions as any)
            .then(v => {
                v.text().then(resolve).catch(reject);
            })
            .catch(reject);
        const e = new Error("Connection timed out");
        setTimeout(reject, timeout, e);
    });
}

async function localCheck(url: string): Promise<boolean> {
    try {
        await fetchLocalCheck(url);
        return true;
    }
    catch (err) {
        return false;
    }
}
