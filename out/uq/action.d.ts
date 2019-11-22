import { Entity } from './entity';
import { ActionCaller } from './caller';
export declare class Action extends Entity {
    readonly typeName: string;
    submit(data: object): Promise<any>;
    submitReturns(data: object): Promise<{
        [ret: string]: any[];
    }>;
}
export declare class ActionSubmitCaller extends ActionCaller {
    readonly path: string;
    buildParams(): any;
}
