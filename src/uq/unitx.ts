import { centerApi, CenterUnitxUrls, UnitxUrlServer } from "../tool/centerApi";
import { Fetch } from "../tool/fetch";

export interface BusMessage {
	id: number;
	face: string;
	from: string;
	body: string;
}

class UnitxApi extends Fetch {
	private readonly unit: number;
	constructor(unit: number, url: string) {
		super(url);
		this.unit = unit;
	}
	async readBus(face: string, queue: number, defer: number): Promise<BusMessage> {
		let ret = await this.post('joint-read-bus', {
			unit: this.unit,
			face,
			queue,
			defer,
		});
		return ret;
	}
	async writeBus(face: string, from: string, queue: number | string, busVersion: number, body: string, defer: number, stamp?: number): Promise<BusMessage> {
		let ret = await this.post('joint-write-bus', {
			unit: this.unit,
			face: face,
			from: from,
			fromQueueId: queue,
			version: busVersion,
			body,
			defer,
			stamp
		});
		return ret;
	}
}

/**
 * 封装UnitX上的接口（如读写bus）
 */
export abstract class Unitx /*extends Uq*/ {
	private unit: number;
	private prevUnitxApi: UnitxApi;
	private currentUnitxApi: UnitxApi;
	private currentCreateTick: number;

	constructor(unit: number) {
		this.unit = unit;
	}

	/**
	 * 初始化this.currentCreateTick / this.prevUnitxApi / this.currentUnitxApi(这3个是干什么的？)
	 */
	async init(): Promise<void> {
		let unitxUrls = await centerApi.unitUnitx(this.unit);
		let { tv, current } = this.toTvCurrent(unitxUrls);
		let prevUnitxUrlServer: UnitxUrlServer, currentUnitxUrlServer: UnitxUrlServer;
		if (current !== undefined) {
			prevUnitxUrlServer = tv;
			currentUnitxUrlServer = current;
		}
		else {
			prevUnitxUrlServer = undefined;
			currentUnitxUrlServer = tv;
		}
		this.currentCreateTick = currentUnitxUrlServer.create;
		console.log('unitx prev', prevUnitxUrlServer);
		console.log('unitx current', currentUnitxUrlServer);
		this.prevUnitxApi = await this.createUnitxApi(prevUnitxUrlServer);
		this.currentUnitxApi = await this.createUnitxApi(currentUnitxUrlServer);
	}

	private async createUnitxApi(unitxUrlServer: UnitxUrlServer): Promise<UnitxApi> {
		if (unitxUrlServer === undefined) return undefined;
		let { url } = unitxUrlServer;
		let unitxUrl = this.unitxUrl(url);
		return new UnitxApi(this.unit, unitxUrl);
	}

	async readBus(face: string, queue: number, defer: number): Promise<any> {
		let unitxApi: UnitxApi;
		if (this.prevUnitxApi === undefined) {
			unitxApi = this.currentUnitxApi;
		}
		else {
			let delta = Date.now() / 1000 - this.currentCreateTick;
			let minutes = delta / 60;
			unitxApi = minutes < 10 ? this.prevUnitxApi : this.currentUnitxApi;

		}
		return await unitxApi.readBus(face, queue, defer);
	}

	async writeBus(face: string, source: string, newQueue: string | number, busVersion: number, body: any, defer: number, stamp?: number) {
		await this.currentUnitxApi.writeBus(face, source, newQueue, busVersion, body, defer, stamp);
	}

	protected abstract toTvCurrent(unitxUrls: CenterUnitxUrls): { tv: UnitxUrlServer, current: UnitxUrlServer };
	protected abstract unitxUrl(url: string): string;
}

export class UqUnitxProd extends Unitx {
	protected toTvCurrent(unitxUrls: CenterUnitxUrls): { tv: UnitxUrlServer, current: UnitxUrlServer } {
		let { tv, prod: current } = unitxUrls;
		return { tv, current };
	}
	protected unitxUrl(url: string): string { return url + 'uq/unitx-prod/' };
}

export class UqUnitxTest extends Unitx {
	protected toTvCurrent(unitxUrls: CenterUnitxUrls): { tv: UnitxUrlServer, current: UnitxUrlServer } {
		let { tv, test: current } = unitxUrls;
		return { tv, current };
	}
	protected unitxUrl(url: string): string { return url + 'uq/unitx-test/' };
}
