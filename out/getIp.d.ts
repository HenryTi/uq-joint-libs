import { Request } from "express";
export declare function getClientIp(req: Request): string | string[];
export declare function getIp(_http: Request): string;
export declare function getNetIp(_http: Request): string;
export declare function validIp(regIp: string | string[], ips: string[]): boolean;
