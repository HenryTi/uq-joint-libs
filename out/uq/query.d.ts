import { Entity } from './entity';
import { QueryQueryCaller, QueryPageCaller } from './caller';
import { ArrFields } from './field';
export declare type QueryPageApi = (name: string, pageStart: any, pageSize: number, params: any) => Promise<string>;
export declare class Query extends Entity {
    readonly typeName: string;
    private pageStart;
    private pageSize;
    private params;
    private more;
    private startField;
    returns: ArrFields[];
    isPaged: boolean;
    setSchema(schema: any): void;
    resetPage(size: number, params: any): void;
    readonly hasMore: boolean;
    loadPage(): Promise<void>;
    protected pageCaller(params: any, showWaiting?: boolean): QueryPageCaller;
    page(params: any, pageStart: any, pageSize: number, showWaiting?: boolean): Promise<any[]>;
    protected queryCaller(params: any, showWaiting?: boolean): QueryQueryCaller;
    query(params: any, showWaiting?: boolean): Promise<any>;
    table(params: any, showWaiting?: boolean): Promise<any[]>;
    obj(params: any, showWaiting?: boolean): Promise<any>;
    scalar(params: any, showWaiting?: boolean): Promise<any>;
}
