"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjPropIgnoreCase = void 0;
function getObjPropIgnoreCase(obj, prop) {
    if (!obj)
        return;
    if (!prop)
        return;
    let keys = Object.keys(obj);
    prop = prop.toLowerCase();
    for (let key of keys) {
        if (key.toLowerCase() === prop)
            return obj[key];
    }
    return;
}
exports.getObjPropIgnoreCase = getObjPropIgnoreCase;
//# sourceMappingURL=objPropIgnoreCase.js.map