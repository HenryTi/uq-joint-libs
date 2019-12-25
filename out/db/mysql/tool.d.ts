export interface Field {
    name: string;
}
export interface Index {
    name: string;
}
interface TableBase {
    name: string;
}
export interface Table extends TableBase {
    code?: string[];
}
export interface TableEx extends TableBase {
    fields: Field[];
    key: Index;
    indexes: Index[];
}
export interface Procedure {
    name: string;
    params?: string[];
    label?: string;
    returns?: string;
    code: string;
}
export declare function execSql(sql: string, values?: any[]): Promise<any>;
export declare function tableFromSql(sql: string, values?: any[]): Promise<any[]>;
export declare function tablesFromSql(sql: string, values?: any[]): Promise<any[]>;
export declare function execProc(proc: string, values?: any[]): Promise<any>;
export declare function tableFromProc(proc: string, values?: any[]): Promise<any[]>;
export declare function tablesFromProc(proc: string, values?: any[]): Promise<any[][]>;
export declare function buildProcedureSql(proc: Procedure): string;
export declare function buildTableSql(tbl: Table): string;
export {};
