import { Mapper } from "./mapper";
import { Joint } from "../joint";
declare abstract class MapData {
    protected joint: Joint;
    constructor(joint: Joint);
    protected abstract tuidId(tuid: string, value: any): Promise<string | number>;
    mapOwner(tuidAndArr: string, ownerVal: any): Promise<number>;
    protected mapProp(i: string, prop: string, data: any): Promise<any>;
    protected mapArrProp(i: string, prop: string, row: any, data: any): Promise<any>;
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
 * 根据外部系统的no从映射表中获取tonva中的id(映射表中不存在的话，调用getTuidVid生成一个，并写入映射表)
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
