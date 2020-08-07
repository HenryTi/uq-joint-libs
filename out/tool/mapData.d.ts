import { Mapper } from "./mapper";
import { Joint } from "../joint";
declare abstract class MapData {
    protected joint: Joint;
    constructor(joint: Joint);
    /**
     * 根据来源数据对象的id以及该id对应的tonva中entity类型，从map中获取对应的tonva系统中id，map中无对应id
     * 设置的，会首先生成该tuid的虚拟id，并记录在map中
     * @param tuid 对应的tonva系统中entity类型名称
     * @param value 来源数据对象的id值
     */
    protected abstract tuidId(tuid: string, value: any): Promise<string | number>;
    mapOwner(tuidAndArr: string, ownerVal: any): Promise<number>;
    /**
     * 处理mapper设置中string格式的转换
     * string设置有几种格式：
     * 1.普通字符串：
     * 2.fieldName@entityName:
     * @param i
     * @param prop mapper中string设置值
     * @param data 来源数据对象
     */
    protected mapProp(i: string, prop: string, data: any): Promise<any>;
    protected mapArrProp(i: string, prop: string, row: any, data: any): Promise<any>;
    /**
     * 根据Mapper的设置，将来源数据对象转换为目标数据对象
     * 对于 filedName@EntityName格式的设置，会去map表中查找对应的tonva系统Id，未找到的情况，会生成虚拟的tonva系统id，并报错到map表中
     * @param data 来源数据对象
     * @param mapper 转换规则
     * @returns 目标数据对象
     */
    map(data: any, mapper: Mapper): Promise<any>;
    private mapArr;
}
/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，调用getTuidVid生成一个，并写入映射表)
 */
export declare class MapToUq extends MapData {
    protected tuidId(tuid: string, value: any): Promise<string | number>;
    protected getTuidVid(uqFullName: string, entity: string): any;
}
/**
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，采用不生成虚拟id的策略，目前仅用于webuser中的webuser表）
 */
export declare class MapUserToUq extends MapToUq {
    protected getTuidVid(uq: string, entity: string): Promise<number>;
}
/**
 * 根据tonva中的id从映射表中获取no
 */
export declare class MapFromUq extends MapData {
    protected tuidId(tuid: string, value: any): Promise<string | number>;
}
export {};
