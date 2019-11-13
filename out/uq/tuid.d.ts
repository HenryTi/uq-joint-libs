import { Entity } from "./entity";
import { Uq } from "./uq";
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
