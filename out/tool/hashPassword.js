"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.comparePassword = exports.hashPassword = void 0;
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcryptjs"));
const saltRounds = 10;
async function hashPassword(pwd) {
    let salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(pwd, salt);
}
exports.hashPassword = hashPassword;
async function comparePassword(pwd, auth) {
    return await bcrypt.compare(pwd, auth) == true;
}
exports.comparePassword = comparePassword;
const algorithm = 'aes-128-cbc';
const cryptoPassword = 'pickering-on-ca';
const ivText = 'longcheng';
const keyLength = 16;
const ivLength = 16;
function encrypt(pwd) {
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
exports.encrypt = encrypt;
function decrypt(cryptedPwd) {
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
exports.decrypt = decrypt;
//# sourceMappingURL=hashPassword.js.map