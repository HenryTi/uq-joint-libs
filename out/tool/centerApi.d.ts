import { Fetch } from './fetch';
declare class CenterApi extends Fetch {
    busSchema(owner: string, bus: string): Promise<string>;
    serviceBus(serviceUID: string, serviceBuses: string): Promise<void>;
    unitx(unit: number): Promise<any>;
    uqUrl(unit: number, uq: number): Promise<any>;
    urlFromUq(unit: number, uqFullName: string): Promise<any>;
    uqDb(name: string): Promise<any>;
    pushTo(msg: any): Promise<void>;
    unitxBuses(unit: number, busOwner: string, bus: string, face: string): Promise<any[]>;
    /**
     * 顺序取到所有最近的user信息，包括密码
     * @param start：这个是userid的起始数；
     * @param page: 这个是每次返回的数组的长度；
     * 返回值是一个数组，数组中对象的schema如下面的注释所示
     */
    queueOut(start: number, page: number): Promise<any[]>;
    /**
     * 根据id从中心服务器获取单个User的注册信息
     * @param id 所要获取User的id
     * @returns object: {"$queue":"0","$type":"$user","id":"10008","name":"xiari307","nick":"","icon":"","country":"","mobile":"18373184674","email":"794997443@qq.com","pwd":"32c4bc0dd66a0b9c780c9fa8acb26702"}
     */
    queueOutOne(id: number): Promise<any>;
    /**
     * 用来将user数据写入Tonva系统（的中心服务器?)
     * @param param: 要写入的user数据，格式如上
     * @returns 正数值表示新建user的id；
     * 出现错误时{id, message} id的含义：-1:id和name不匹配；-2：email已经被使用过了；-3: mobile已经被使用过了；-4: wechat已经被使用了；
     */
    queueIn(param: any): Promise<number>;
}
export declare const centerApi: CenterApi;
export {};
