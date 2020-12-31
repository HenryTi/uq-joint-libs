import { Uq } from "./uq";
export declare abstract class Uqs {
    private readonly uqs;
    private readonly userName;
    private readonly password;
    readonly unit: number;
    constructor(unit: number, userName: string, password: string);
    getUq(uqFullName: string): Promise<Uq>;
    private createUq;
    protected abstract newUq(uqFullName: string): Uq;
}
export declare class UqsProd extends Uqs {
    protected newUq(uqFullName: string): any;
}
export declare class UqsTest extends Uqs {
    protected newUq(uqFullName: string): any;
}
