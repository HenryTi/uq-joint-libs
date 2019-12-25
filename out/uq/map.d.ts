import { Entity } from './entity';
import { Action } from './action';
import { Query } from './query';
import { Field } from './field';
interface MapActions {
    add: Action;
    del: Action;
}
interface MapQueries {
    all: Query;
    page: Query;
    query: Query;
}
export declare class Map extends Entity {
    get typeName(): string;
    keys: Field[];
    actions: MapActions;
    queries: MapQueries;
    schemaFrom: {
        owner: string;
        uq: string;
    };
    setSchema(schema: any): void;
    add(param: any): Promise<any>;
    del(param: any): Promise<any>;
    all(): Promise<any>;
    page(param: any, pageStart: any, pageSize: number): Promise<any>;
    query(param: any): Promise<any>;
    table(params: any): Promise<any[]>;
    obj(params: any): Promise<any>;
    scalar(params: any): Promise<any>;
}
export {};
