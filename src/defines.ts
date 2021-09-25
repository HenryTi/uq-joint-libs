import { Mapper } from "./tool/mapper";
import { Joint } from "./joint";
import { UqProp } from "./uq/uq";
import { Notifier } from "./notifier/smsNotifier";

export interface DataPullResult { lastPointer: number | string, data: any[] };
export type DataPull<T extends UqPullPush> = (joint: Joint, uqIn: T, queue: number | string) => Promise<DataPullResult>;
export type DataPush<T extends UqPullPush> = (joint: Joint, uqIn: T, queue: number, data: any) => Promise<boolean>;
export type PullWrite<T extends UqIn> = (joint: Joint, uqIn: T, data: any) => Promise<boolean>;

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
    key: string;    // 在源数据中，ID主键的名称, 用于建立map
    /**
     * 从
     */
    pull?: DataPull<UqInID> | string;
    push?: DataPush<UqInID>;
}

export interface UqInTuid extends UqIn {
    type: 'tuid';
    key: string;    // 在源数据中，tuid主键的名称, 用于建立map
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
    //push?: DataPush;
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
    uqIdProps?: { [name: string]: UqProp }; //{contact: {tuid: 'contact'}}
    defer?: number;
}

export interface Settings {
    name: string;
    unit: number;
    allowedIP: string[];
    uqIns: UqIn[];
    uqOuts: UqOut[];
    uqInEntities: { name: string, intervalUnit: number }[],
    uqBusSettings: string[];
    scanInterval?: number;
    notifier?: Notifier;

    userName?: string;
    password?: string;

    bus?: { [busName: string]: UqBus };
    pullReadFromSql?: (sql: string, queue: number | string) => Promise<DataPullResult>;
}

export function getMapName(uqIn: UqIn): string {
    let { entity, uq } = uqIn;
    let pos = uq.indexOf('/');
    if (pos > 0)
        return (uq.substring(pos + 1) + "_" + entity).toLowerCase();
    else {
        console.error('uq格式不正确，其中应该带有/符号');
        throw EvalError;
    }
}

export function getOwnerMapName(uqIn: UqInTuidArr): string {
    let { entity, uq } = uqIn;

    let parts = entity.split('_');
    let tuidOwner = parts[0];
    if (parts.length === 1) throw 'tuid ' + entity + ' must has .arr';

    let pos = uq.indexOf('/');
    if (pos > 0)
        return (uq.substring(pos + 1) + "_" + tuidOwner).toLowerCase();
    else {
        console.error('uq格式不正确，其中应该带有/符号');
        throw EvalError;
    }
}