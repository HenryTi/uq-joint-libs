import { Headers } from "node-fetch";
import { Fetch } from "./fetch";
export declare abstract class Caller<T> {
    protected readonly _params: T;
    constructor(params: T, waiting: boolean);
    protected get params(): any;
    buildParams(): any;
    method: string;
    abstract get path(): string;
    get headers(): {
        [header: string]: string;
    };
    waiting: boolean;
}
export declare class UqApi extends Fetch {
    private _apiToken;
    protected unit: number;
    protected get apiToken(): string;
    constructor(baseUrl: string, unit: number, apiToken?: string);
    xcall(caller: Caller<any>): Promise<any>;
    private buildOptions;
    protected buildHeaders(): Headers;
    protected appendHeaders(headers: Headers): void;
    bus(faces: string, faceUnitMessages: string): Promise<any>;
    tuid(unit: number, id: number, tuid: string, maps: string[]): Promise<any>;
    saveID(ID: string, data: any): Promise<any>;
    saveTuid(tuid: string, data: any): Promise<any>;
    saveTuidArr(tuid: string, arr: string, owner: number, data: any): Promise<any>;
    getTuidVId(tuid: string): Promise<number>;
    scanSheet(sheet: string, scanStartId: number): Promise<any>;
    action(action: string, data: any): Promise<void>;
    setMap(map: string, data: any): Promise<void>;
    delMap(map: string, data: any): Promise<void>;
    loadTuidMainValue(tuidName: string, id: number, allProps: boolean): Promise<any>;
    loadTuidDivValue(tuidName: string, divName: string, id: number, ownerId: number, allProps: boolean): Promise<any>;
    loadEntities(): Promise<any>;
    schema(entityName: string): Promise<any>;
}
