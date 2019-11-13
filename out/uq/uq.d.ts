import { Tuid } from "./tuid";
import { Field, ArrFields } from "./field";
import { UqApi } from "../tool/uqApi";
import { Uqs } from "./uqs";
export declare class Uq {
    private uqs;
    private uqFullName;
    private id;
    private tuids;
    private tuidArr;
    protected uqApi: UqApi;
    constructor(uqs: Uqs, uqFullName: string);
    init(): Promise<void>;
    buildData(data: any, props: {
        [name: string]: UqProp;
    }): Promise<any>;
    private buildTuidValue;
    getFromUq(uqFullName: string): Promise<Uq>;
    getTuidFromUq(uqFullName: string, tuidName: string): Promise<Tuid>;
    getTuidFromName(tuidName: string): Tuid;
    schema(entityName: string): Promise<any>;
    saveTuid(tuid: string, body: any): Promise<{
        id: number;
        inId: number;
    }>;
    saveTuidArr(tuid: string, tuidArr: string, ownerId: number, body: any): Promise<{
        id: number;
        inId: number;
    }>;
    getTuidVId(ownerEntity: string): Promise<number>;
    loadTuidMainValue(tuidName: string, id: number, allProps: boolean): Promise<any>;
    loadTuidDivValue(tuidName: string, divName: string, id: number, ownerId: number, allProps: boolean): Promise<any>;
    setMap(map: string, body: any): Promise<void>;
    delMap(map: string, body: any): Promise<void>;
    private initUqApi;
    private buildTuids;
    private buildAccess;
    private fromType;
    private fromObj;
    protected loadEntities(): Promise<void>;
    private buildEntities;
    getTuid(name: string, div?: string, tuidUrl?: string): Tuid;
    private newTuid;
    buildFieldTuid(fields: Field[], mainFields?: Field[]): void;
    buildArrFieldsTuid(arrFields: ArrFields[], mainFields: Field[]): void;
}
export declare class UqUnitx extends Uq {
    readBus(face: string, queue: number): Promise<any>;
    writeBus(face: string, source: string, newQueue: string | number, busVersion: number, body: any): Promise<void>;
    protected loadEntities(): Promise<void>;
}
export interface Prop {
    all?: boolean;
    props?: {
        [name: string]: Prop | boolean;
    };
}
export interface UqProp extends Prop {
    uq?: string;
    tuid: string;
    tuidOwnerProp?: string;
}
