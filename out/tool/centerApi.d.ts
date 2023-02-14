import { Fetch } from './fetch';
interface Guest {
    id: number;
    guest: number;
    token: string;
}
interface User extends Guest {
    id: number;
    name: string;
    nick?: string;
    icon?: string;
}
export interface UnitxUrlServer {
    type: 'tv' | 'test' | 'prod';
    url: string;
    server: number;
    create: number;
}
export interface CenterUnitxUrls {
    tv: UnitxUrlServer;
    test: UnitxUrlServer;
    prod: UnitxUrlServer;
}
declare class CenterApi extends Fetch {
    private _user;
    private _loginResult;
    get loginResult(): any;
    protected get apiToken(): string;
    login(params: {
        user: string;
        pwd: string;
        guest?: number;
    }): Promise<User>;
    /**
     * 根据key查询注册客户信息
     * @param key 可以是name/mobile/email
     * @returns 未找到，返回undefinde，否则返回对象格式如下：
     * {"id":76349,"name":"li.guosheng@jk-sci.com","nick":null,"icon":null,"email":"li.guosheng@jk-sci.com","mobile":null,"mobile_country":86}
     */
    userFromKey(key: string): Promise<User>;
    busSchema(owner: string, bus: string): Promise<string>;
    serviceBus(serviceUID: string, serviceBuses: string): Promise<void>;
    /**
     * 获取某个unit所对应的unitx服务器的地址
     * @param unit
     * @returns ret object, 各属性名为unitx的类型，值为对应unitx的地址？
     */
    unitUnitx(unit: number): Promise<CenterUnitxUrls>;
    uqToken(unit: number, uqOwner: string, uqName: string): Promise<any>;
    uqUrl(unit: number, uq: number): Promise<any>;
    urlFromUq(unit: number, uqFullName: string): Promise<any>;
    uqDb(name: string): Promise<any>;
    pushTo(msg: any): Promise<void>;
    unitxBuses(unit: number, busOwner: string, bus: string, face: string): Promise<any[]>;
    /**
     * 从中心服务器提供的bus中顺序取到所有最近的user信息，包括密码
     * @param start：这个是bus消息的顺序号；
     * @param page: 这个是每次返回的数组的长度；
     * 返回值是一个数组，数组中对象的schema如下面的注释所示
     */
    queueOut(start: number, page: number): Promise<any[]>;
    /**
     * 根据id从中心服务器获取单个User的注册信息, 完整的url是:https://tv.jkchemical.com/tv/open/user-from-id?id=xxx
     * @param id 所要获取User的id
     * @returns object: {"$queue":"0","$type":"$user","id":"10008","name":"xiari307","nick":"","icon":"","country":"","mobile":"18373184674","email":"794997443@qq.com","pwd":"32c4bc0dd66a0b9c780c9fa8acb26702"}
     */
    queueOutOne(id: number): Promise<any>;
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
    queueIn(param: any): Promise<number>;
}
export declare const centerApi: CenterApi;
export {};
