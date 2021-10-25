"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTableSql = exports.buildProcedureSql = exports.tablesFromProc = exports.tableFromProc = exports.execProc = exports.tablesFromSql = exports.tableFromSql = exports.execSql = void 0;
const mysql_1 = require("mysql");
const config_1 = __importDefault(require("config"));
const mysqlConfig = config_1.default.get("mysqlConn");
const pool = (0, mysql_1.createPool)(mysqlConfig);
const databaseName = config_1.default.get('database');
function buildCall(proc, values) {
    let ret = 'call `' + databaseName + '`.`' + proc + '`(';
    if (values !== undefined) {
        ret += values.map(v => '?').join(',');
    }
    return ret + ');';
}
/**
 * 执行sql语句
 * @param sql 要执行的sql语句
 * @param values 参数数组
 * @returns mysqlpackage的原始执行结果：{}
 */
function execSql(sql, values = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (err, result) => {
            if (err !== null) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}
exports.execSql = execSql;
/**
 * 执行sql语句
 * @param sql 要执行的sql语句
 * @param values 参数数组
 * @returns 为数据的对象数组
 */
async function tableFromSql(sql, values) {
    let res = await execSql(sql, values);
    if (Array.isArray(res) === false)
        return [];
    if (res.length === 0)
        return [];
    let row0 = res[0];
    if (Array.isArray(row0))
        return row0;
    return res;
}
exports.tableFromSql = tableFromSql;
async function tablesFromSql(sql, values) {
    return await execSql(sql, values);
}
exports.tablesFromSql = tablesFromSql;
/**
 * 执行存储过程
 * @param proc 要执行的存储过程名称
 * @param values 参数数组
 * @returns 返回值
 */
async function execProc(proc, values) {
    return await new Promise((resolve, reject) => {
        let sql = buildCall(proc, values);
        pool.query(sql, values, (err, result) => {
            if (err !== null) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}
exports.execProc = execProc;
async function tableFromProc(proc, values) {
    let res = await execProc(proc, values);
    if (Array.isArray(res) === false)
        return [];
    switch (res.length) {
        case 0: return [];
        default: return res[0];
    }
}
exports.tableFromProc = tableFromProc;
async function tablesFromProc(proc, values) {
    return await execProc(proc, values);
}
exports.tablesFromProc = tablesFromProc;
function buildProcedureSql(proc) {
    let { name, params, label, code, returns } = proc;
    let ret = 'CREATE ';
    ret += returns === undefined ? 'PROCEDURE ' : 'FUNCTION ';
    ret += name + ' (';
    if (params !== undefined)
        ret += params.join(',');
    ret += ')\n';
    if (returns !== undefined)
        ret += "RETURNS " + returns + "\n";
    if (label !== undefined)
        ret += label + ': ';
    ret += 'BEGIN \n';
    ret += code;
    ret += '\nEND\n';
    return ret;
}
exports.buildProcedureSql = buildProcedureSql;
function buildTableSql(tbl) {
    let ret = 'CREATE TABLE IF NOT EXISTS ' + tbl.name + ' (';
    ret += tbl.code.join(',');
    ret += ');\n';
    return ret;
}
exports.buildTableSql = buildTableSql;
//# sourceMappingURL=tool.js.map