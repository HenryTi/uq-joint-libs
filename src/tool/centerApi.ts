import jwtDecode from 'jwt-decode';
import { Fetch } from './fetch';

interface Guest {
    id: number;             // id = 0
    guest: number;
    token: string;
}

interface User extends Guest {
    id: number;
    name: string;
    nick?: string;
    icon?: string;
}

function decodeUserToken(token: string): User {
    let ret: any = jwtDecode(token);
    let user: User = {
        id: ret.id,
        name: ret.name,
        guest: ret.guest,
        token: token,
    };
    return user;
}

export interface UnitxUrlServer {
    type: 'tv' | 'test' | 'prod';
    url: string;
    server: number;
    create: number;		// tick time on create
}

export interface CenterUnitxUrls {
    tv: UnitxUrlServer;
    test: UnitxUrlServer;
    prod: UnitxUrlServer;
}

class CenterApi extends Fetch {
    private _user: string;
    private _loginResult: any;
    get loginResult(): any { return this._loginResult }

    protected get apiToken(): string { return this._loginResult && this._loginResult.token; }

    async login(params: { user: string, pwd: string, guest?: number }): Promise<User> {
        if (this._user === params.user) return this._loginResult;

        let ret = await this.get('user/login', params);
        switch (typeof ret) {
            default: return;
            case 'string':
                this._user = params.user;
                return this._loginResult = decodeUserToken(ret);
            case 'object':
                this._user = params.user;
                let token = ret.token;
                let userRet = decodeUserToken(token);
                let { nick, icon } = ret;
                if (nick) userRet.nick = nick;
                if (icon) userRet.icon = icon;
                return this._loginResult = userRet;
        }
    }

    async busSchema(owner: string, bus: string): Promise<string> {
        let ret = await this.get('open/bus', { owner: owner, bus: bus });
        return ret.schema;
    }

    async serviceBus(serviceUID: string, serviceBuses: string): Promise<void> {
        await this.post('open/save-service-bus', {
            service: serviceUID,
            bus: serviceBuses,
        });
    }

    /**
     * 获取某个unit所对应的unitx服务器的地址 
     * @param unit 
     * @returns ret object, 各属性名为unitx的类型，值为对应unitx的地址？
     */
    async unitUnitx(unit: number): Promise<CenterUnitxUrls> {
        let items: UnitxUrlServer[] = await this.get('open/unit-unitx', { unit: unit });
        let ret: CenterUnitxUrls = {} as any;
        for (let item of items) {
            let { type } = item;
            ret[type] = item;
        }
        return ret;
    }

    async uqToken(unit: number, uqOwner: string, uqName: string): Promise<any> {
        return await this.get('tie/app-uq', { unit: unit, uqOwner: uqOwner, uqName: uqName, testing: false });
    }

    async uqUrl(unit: number, uq: number): Promise<any> {
        return await this.get('open/uq-url', { unit: unit, uq: uq });
    }

    async urlFromUq(unit: number, uqFullName: string): Promise<any> {
        return await this.post('open/url-from-uq', { unit: unit, uq: uqFullName });
    }

    async uqDb(name: string): Promise<any> {
        return await this.get('open/uqdb', { name: name });
    }

    async pushTo(msg: any): Promise<void> {
        return await this.post('push', msg);
    }

    async unitxBuses(unit: number, busOwner: string, bus: string, face: string): Promise<any[]> {
        return await this.get('open/unitx-buses', { unit: unit, busOwner: busOwner, bus: bus, face: face });
    }

    /**
     * 从中心服务器提供的bus中顺序取到所有最近的user信息，包括密码
     * @param start：这个是bus消息的顺序号；
     * @param page: 这个是每次返回的数组的长度；
     * 返回值是一个数组，数组中对象的schema如下面的注释所示
     */
    async queueOut(start: number, page: number): Promise<any[]> {
        return await this.get('open/queue-out', { start: start, page: page });
    }

    /**
     * 根据id从中心服务器获取单个User的注册信息, 完整的url是:https://tv.jkchemical.com/tv/open/user-from-id?id=xxx
     * @param id 所要获取User的id
     * @returns object: {"$queue":"0","$type":"$user","id":"10008","name":"xiari307","nick":"","icon":"","country":"","mobile":"18373184674","email":"794997443@qq.com","pwd":"32c4bc0dd66a0b9c780c9fa8acb26702"}
     */
    async queueOutOne(id: number): Promise<any> {
        try {
            return await this.get('open/user-from-id', { id: id });
        } catch (error) {
            console.error(error);
        }
    }

    /*
    */

    /**
     * 用来将user数据写入Tonva系统（的中心服务器?)
     * @param param: 要写入的user数据，格式如下
     * param: {
        $type: '$user',
        id: 2,
        name: '1',
        pwd: 'pwd',
        nick: 'nick1-1',
        icon: 'icon1-1',
        country: 3,
        mobile: 13901060561,
        email: 'liaohengyi123@outlook.com',
        wechat: 'wechat212',
     * }
     * @returns 正数值表示新建user的id；
     * 出现错误时{id, message} id的含义：-1:id和name不匹配；-2：email已经被使用过了；-3: mobile已经被使用过了；-4: wechat已经被使用了；
     */
    async queueIn(param: any): Promise<number> {
        return await this.post('open/queue-in', param)
    }
}

export const centerApi = new CenterApi();
