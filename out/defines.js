"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
function getMapName(uqIn) {
    let { entity, uq } = uqIn;
    let pos = uq.indexOf('/');
    if (pos > 0)
        return (uq.substring(pos + 1) + "_" + entity).toLowerCase();
    else {
        console.error('uq格式不正确，其中应该带有/符号');
        throw EvalError;
    }
}
exports.getMapName = getMapName;
function getOwnerMapName(uqIn) {
    let { entity, uq } = uqIn;
    let parts = entity.split('_');
    let tuidOwner = parts[0];
    if (parts.length === 1)
        throw 'tuid ' + entity + ' must has .arr';
    let pos = uq.indexOf('/');
    if (pos > 0)
        return (uq.substring(pos + 1) + "_" + tuidOwner).toLowerCase();
    else {
        console.error('uq格式不正确，其中应该带有/符号');
        throw EvalError;
    }
}
exports.getOwnerMapName = getOwnerMapName;
//# sourceMappingURL=defines.js.map