/**
 * 建立实体在tonva和老系统内id的对应关系
 * @param moniker 实体名称
 * @param id 在tonva中的id
 * @param no 在老系统中的id
 */
export declare function map(moniker: string, id: number, no: string): Promise<void>;
