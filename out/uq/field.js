"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldDefaultValue = void 0;
function fieldDefaultValue(type) {
    switch (type) {
        case 'tinyint':
        case 'smallint':
        case 'int':
        case 'bigint':
        case 'dec':
            return 0;
        case 'char':
        case 'text':
            return '';
        case 'datetime':
        case 'date':
            return '2000-1-1';
        case 'time':
            return '0:00';
    }
}
exports.fieldDefaultValue = fieldDefaultValue;
//# sourceMappingURL=field.js.map