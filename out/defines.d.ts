import { Mapper } from "./tool/mapper";
import { Joint } from "./joint";
import { UqProp } from "./uq/uq";
import { Notifier } from "./notifier/smsNotifier";
export interface DataPullResult {
    lastPointer: number | string;
    data: any[];
    stamp?: number;
    importing: boolean;
}
export declare type DataPull<T extends UqPullPush> = (joint: Joint, uqIn: T, queue: number | string) => Promise<DataPullResult>;
export declare type DataPush<T extends UqPullPush> = (joint: Joint, uqIn: T, queue: number, data: any) => Promise<boolean>;
export declare type PullWrite<T extends UqIn> = (joint: Joint, uqIn: T, data: any) => Promise<boolean>;
interface UqPullPush {
    pull?: DataPull<UqPullPush> | string;
    push?: DataPush<UqPullPush>;
}
export interface UqIn extends UqPullPush {
    uq: string;
    entity: string;
    type: 'ID' | 'tuid' | 'tuid-arr' | 'map';
    /**
     * 配置从源数据到目的数据的转换规则
     */
    mapper: Mapper;
    /**
     * 从（增量）数据源获取数据的函数或SQL语句
     */
    pull?: DataPull<UqIn> | string;
    /**
     * 将增量数据发送到目的服务器的函数
     */
    pullWrite?: PullWrite<UqIn>;
    onPullWriteError?: 'continue' | 'break';
    /**
     * 将初始数据发送到目的服务器的函数
     */
    firstPullWrite?: PullWrite<UqIn>;
    push?: DataPush<UqIn>;
}
export interface UqInID extends UqIn {
    type: 'ID';
    key: string;
    /**
     * 从
     */
    pull?: DataPull<UqInID> | string;
    push?: DataPush<UqInID>;
}
export interface UqInTuid extends UqIn {
    type: 'tuid';
    key: string;
    /**
     * 从
     */
    pull?: DataPull<UqInTuid> | string;
    push?: DataPush<UqInTuid>;
}
export interface UqInTuidArr extends UqIn {
    type: 'tuid-arr';
    key: string;
    owner: string;
    pull?: DataPull<UqInTuidArr> | string;
    push?: DataPush<UqInTuidArr>;
}
export interface UqInMap extends UqIn {
    type: 'map';
    pull?: DataPull<UqInMap> | string;
    push?: DataPush<UqInMap>;
}
export interface UqOut extends UqPullPush {
    uq: string;
    entity: string;
    type: 'tuid' | 'tuid-arr' | 'map';
    mapper: Mapper;
}
export interface UqBus extends UqPullPush {
    /**
     * face的名称
     */
    face: string;
    /**
     * bus数据的来源，center表示来自中心服务器；local表示来自非中心服务器；
     */
    from: 'center' | 'local';
    /**
     * 用于定义目标系统schema各字段的来源
     */
    mapper: Mapper;
    /**
     * 该函数用户从外部系统读取将要写入bus的数据
     */
    pull?: DataPull<UqBus>;
    /**
     * 该函数用户将bus中的数据写入外部系统
     */
    push?: DataPush<UqBus>;
    uqIdProps?: {
        [name: string]: UqProp;
    };
    defer?: number;
}
export interface Settings {
    name: string;
    unit: number;
    allowedIP: string[];
    uqIns: UqIn[];
    uqOuts: UqOut[];
    uqInEntities: {
        name: string;
        intervalUnit: number;
    }[];
    uqBusSettings: string[];
    scanInterval?: number;
    notifier?: Notifier;
    userName?: string;
    password?: string;
    bus?: {
        [busName: string]: UqBus;
    };
    pullReadFromSql?: (sql: string, queue: number | string) => Promise<DataPullResult>;
}
export declare function getMapName(uqIn: UqIn): string;
export declare function getOwnerMapName(uqIn: UqInTuidArr): string;
export {};
