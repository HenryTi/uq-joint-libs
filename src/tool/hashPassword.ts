import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const saltRounds = 10;
export async function hashPassword(pwd: string): Promise<string> {
    let salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(pwd, salt);
}

export async function comparePassword(pwd: string, auth: string) {
    return await bcrypt.compare(pwd, auth) == true;
}


const algorithm = 'aes-128-cbc';
const cryptoPassword = 'pickering-on-ca';
const ivText = 'longcheng';
const keyLength = 16;
const ivLength = 16;

export function encrypt(pwd: string): string {
    try {
        let key = Buffer.concat([Buffer.from(cryptoPassword)], keyLength);
        let iv = Buffer.concat([Buffer.from(ivText)], ivLength);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(Buffer.from(pwd, 'utf8'));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}

export function decrypt(cryptedPwd: string): string {
    try {
        let key = Buffer.concat([Buffer.from(cryptoPassword)], keyLength);
        let iv = Buffer.concat([Buffer.from(ivText)], ivLength);
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let de = decipher.update(Buffer.from(cryptedPwd, 'hex'));
        de = Buffer.concat([de, decipher.final()]);
        return de.toString();
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
