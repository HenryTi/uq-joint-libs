import { Tuid } from "./tuid";
import { Field, ArrFields } from "./field";
import { UqApi } from "../tool/uqApi";
import { Uqs } from "./uqs";
import { Sheet } from "./sheet";
import { Action } from "./action";
import { Query } from "./query";
import { Map } from "./map";
export declare abstract class Uq {
    private readonly uqs;
    private readonly uqFullName;
    private readonly tuids;
    private readonly tuidArr;
    private readonly sheets;
    private readonly sheetArr;
    private readonly actions;
    private readonly actionArr;
    private readonly queries;
    private readonly queryArr;
    private readonly maps;
    private readonly mapArr;
    uqApi: UqApi;
    id: number;
    uqVersion: number;
    constructor(uqs: Uqs, uqFullName: string);
    init(userName: string, password: string): Promise<void>;
    buildData(data: any, props: {
        [name: string]: UqProp;
    }): Promise<any>;
    private buildTuidValue;
    getFromUq(uqFullName: string): Promise<Uq>;
    getTuidFromUq(uqFullName: string, tuidName: string): Promise<Tuid>;
    getTuidFromName(tuidName: string): Tuid;
    schema(entityName: string): Promise<any>;
    getIDNew(ID: string, keys: {
        [key: string]: any;
    }): Promise<number>;
    saveID(ID: string, body: any): Promise<{
        id: number;
        inId: number;
    }>;
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
    protected abstract getReadUrl(uqUrl: {
        url: string;
        urlTest: string;
    }): string;
    protected unitUrl(unit: number): Promise<string>;
    private buildTuids;
    private buildAccess;
    private fromType;
    private fromObj;
    private buildSheet;
    protected loadEntities(): Promise<void>;
    buildEntities(entities: any): void;
    getTuid(name: string, div?: string, tuidUrl?: string): Tuid;
    private newTuid;
    buildFieldTuid(fields: Field[], mainFields?: Field[]): void;
    buildArrFieldsTuid(arrFields: ArrFields[], mainFields: Field[]): void;
    private newSheet;
    newAction(name: string, id: number): Action;
    newQuery(name: string, id: number): Query;
    tuid(name: string): Tuid;
    action(name: string): Action;
    sheet(name: string): Sheet;
    query(name: string): Query;
    map(name: string): Map;
    private newMap;
}
export declare class UqProd extends Uq {
    protected getReadUrl(uqUrl: {
        url: string;
        urlTest: string;
    }): string;
}
export declare class UqTest extends Uq {
    protected getReadUrl(uqUrl: {
        url: string;
        urlTest: string;
    }): string;
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
