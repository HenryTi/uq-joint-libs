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
/**
 * 执行sql语句
 * @param sql 要执行的sql语句
 * @param values 参数数组
 * @returns mysqlpackage的原始执行结果：{}
 */
export declare function execSql(sql: string, values?: any[]): Promise<any>;
/**
 * 执行sql语句
 * @param sql 要执行的sql语句
 * @param values 参数数组
 * @returns 为数据的对象数组
 */
export declare function tableFromSql(sql: string, values?: any[]): Promise<any[]>;
export declare function tablesFromSql(sql: string, values?: any[]): Promise<any[]>;
/**
 * 执行存储过程
 * @param proc 要执行的存储过程名称
 * @param values 参数数组
 * @returns 返回值
 */
export declare function execProc(proc: string, values?: any[]): Promise<any>;
export declare function tableFromProc(proc: string, values?: any[]): Promise<any[]>;
export declare function tablesFromProc(proc: string, values?: any[]): Promise<any[][]>;
export declare function buildProcedureSql(proc: Procedure): string;
export declare function buildTableSql(tbl: Table): string;
export {};
