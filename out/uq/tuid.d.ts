import { Entity } from "./entity";
import { Uq } from "./uq";
export interface TuidSaveResult {
    id: number;
    inId: number;
}
export declare abstract class Tuid extends Entity {
    private cache;
    private cacheAllProps;
    protected fromUq: Uq;
    owner: TuidMain;
    from: {
        owner: string;
        uq: string;
    };
    readonly typeName: string;
    getIdFromObj(obj: any): any;
    setSchema(schema: any): void;
    getTuidFrom(): Promise<Tuid>;
    loadValue(id: number, ownerId: number, allProps: boolean): Promise<any>;
    protected abstract internalLoadTuidValue(uq: Uq, id: number, ownerId: number, allProps: boolean): Promise<any>;
    save(id: number, props: any): Promise<TuidSaveResult>;
    all(): Promise<any[]>;
    search(key: string, pageStart: string | number, pageSize: number): Promise<any[]>;
    searchArr(owner: number, key: string, pageStart: string | number, pageSize: number): Promise<any>;
    loadArr(arr: string, owner: number, id: number): Promise<any>;
    saveArr(arr: string, owner: number, id: number, props: any): Promise<any>;
    posArr(arr: string, owner: number, id: number, order: number): Promise<any>;
}
export declare class TuidMain extends Tuid {
    readonly Main: this;
    divs: {
        [name: string]: TuidDiv;
    };
    setSchema(schema: any): void;
    protected internalLoadTuidValue(uq: Uq, id: number, ownerId: number, allProps: boolean): Promise<any>;
}
export declare class TuidDiv extends Tuid {
    readonly Main: TuidMain;
    getTuidFrom(): Promise<Tuid>;
    protected internalLoadTuidValue(uq: Uq, id: number, ownerId: number, allProps: boolean): Promise<any>;
}
