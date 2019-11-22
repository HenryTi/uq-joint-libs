import { UqUnitx, Uq } from "./uq";

const $unitx = '$$$/$unitx';

export class Uqs {
    //private joint: Joint;
    private uqs: { [name: string]: Uq } = {};
    private unitx: UqUnitx;
    private userName: string;
    private password: string;

    constructor(unit: number, userName: string, password: string) {
        this.unit = unit;
        this.userName = userName;
        this.password = password;
    }

    readonly unit:number;
    /*
    async getOpenApi(uq: string): Promise<UqApi> {
        return await this.joint.getOpenApi(uq);
    }
    */

    async getUq(uqFullName: string) {
        let uq = this.uqs[uqFullName];
        if (uq !== undefined) return uq;
        return this.uqs[uqFullName] = await this.createUq(uqFullName);
    }

    private async createUq(uqFullName: string): Promise<Uq> {
        let uq = new Uq(this, uqFullName);
        await uq.init(this.userName, this.password);
        this.uqs[uqFullName] = uq;
        return uq;
    }

    async init() {
        this.unitx = new UqUnitx(this, $unitx);
        await this.unitx.init(this.userName, this.password);
    }

    async readBus(face: string, queue: number): Promise<any> {
        return await this.unitx.readBus(face, queue);
    }

    async writeBus(face: string, source: string, newQueue: string | number, busVersion:number, body: any) {
        await this.unitx.writeBus(face, source, newQueue, busVersion, body);
    }
}

