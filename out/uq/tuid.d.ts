import { Entity } from "./entity";
import { Uq } from "./uq";
import { UqApi } from '../tool/uqApi';
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
    protected abstract internalLoadTuidValue(openApi: UqApi, id: number, ownerId: number, allProps: boolean): Promise<any>;
}
export declare class TuidMain extends Tuid {
    readonly Main: this;
    readonly uqApi: UqApi;
    divs: {
        [name: string]: TuidDiv;
    };
    setSchema(schema: any): void;
    protected internalLoadTuidValue(openApi: UqApi, id: number, ownerId: number, allProps: boolean): Promise<any>;
}
export declare class TuidDiv extends Tuid {
    readonly Main: TuidMain;
    getTuidFrom(): Promise<Tuid>;
    protected internalLoadTuidValue(openApi: UqApi, id: number, ownerId: number, allProps: boolean): Promise<any>;
}
