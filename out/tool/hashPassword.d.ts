export declare function hashPassword(pwd: string): Promise<string>;
export declare function comparePassword(pwd: string, auth: string): Promise<boolean>;
export declare function encrypt(pwd: string): string;
export declare function decrypt(cryptedPwd: string): string;
