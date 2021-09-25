//import { Unitx, UqUnitxProd, UqUnitxTest } from './unitx';
import { Uq, UqProd, UqTest } from "./uq";

export abstract class Uqs {
	private readonly uqs: { [name: string]: Uq } = {};
    private readonly userName: string;
    private readonly password: string;

    readonly unit:number;

    constructor(unit: number, userName: string, password: string) {
        this.unit = unit;
        this.userName = userName;
        this.password = password;
    }

    async getUq(uqFullName: string) {
        let uq = this.uqs[uqFullName];
        if (uq !== undefined) return uq;
        return this.uqs[uqFullName] = await this.createUq(uqFullName);
    }

    private async createUq(uqFullName: string): Promise<Uq> {
        let uq =  this.newUq(uqFullName);
        await uq.init(this.userName, this.password);
        this.uqs[uqFullName] = uq;
        return uq;
    }

	protected abstract newUq(uqFullName:string):Uq;
}

export class UqsProd extends Uqs {
	protected newUq(uqFullName:string) { return  new UqProd(this, uqFullName); }
	//protected newUqUnitx() { return new UqUnitxProd(this); }
}

export class UqsTest extends Uqs {
	protected newUq(uqFullName:string) { return  new UqTest(this, uqFullName); }
	//protected newUqUnitx() { return new UqUnitxTest(this); }
}
