import { Uq } from "./uq";
export declare class Uqs {
    private uqs;
    private unitx;
    constructor(unit: number);
    readonly unit: number;
    getUq(uqFullName: string): Promise<Uq>;
    private createUq;
    init(): Promise<void>;
    readBus(face: string, queue: number): Promise<any>;
    writeBus(face: string, source: string, newQueue: string | number, busVersion: number, body: any): Promise<void>;
}
