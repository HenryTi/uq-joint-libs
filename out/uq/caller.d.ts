import { Entity } from './entity';
import { Action } from './action';
import { Query } from './query';
import { Caller } from '../tool/uqApi';
export declare abstract class EntityCaller<T> extends Caller<T> {
    private tries;
    protected _entity: Entity;
    constructor(entity: Entity, params: T, waiting?: boolean);
    protected get entity(): Entity;
    request(): Promise<any>;
    protected innerCall(): Promise<any>;
    innerRequest(): Promise<any>;
    xresult(res: any): any;
    get headers(): {
        [header: string]: string;
    };
    private retry;
    private rebuildSchema;
}
export declare abstract class ActionCaller extends EntityCaller<any> {
    protected get entity(): Action;
}
export declare class QueryQueryCaller extends EntityCaller<any> {
    protected get entity(): Query;
    get path(): string;
    xresult(res: any): any;
    buildParams(): any;
}
export declare class QueryPageCaller extends EntityCaller<any> {
    protected get params(): {
        pageStart: any;
        pageSize: number;
        params: any;
    };
    protected get entity(): Query;
    get path(): string;
    buildParams(): any;
    xresult(res: any): any;
}
