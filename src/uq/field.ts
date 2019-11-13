import { Tuid } from "./tuid";

export type FieldType = 'tinyint' | 'smallint' | 'int' | 'bigint' | 'dec' | 'char' | 'text' 
    | 'datetime' | 'date' | 'time';

export function fieldDefaultValue(type:FieldType) {
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

export interface Field {
    name: string;
    type: FieldType;
    tuid?: string;
    arr?: string;
    url?: string;
    null?: boolean;
    size?: number;
    owner?: string;
    _ownerField: Field;
    _tuid: Tuid;
}
export interface ArrFields {
    name: string;
    fields: Field[];
    id?: string;
    order?: string;
}
export interface FieldMap {
    [name:string]: Field;
}
