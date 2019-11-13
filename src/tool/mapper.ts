/*
export interface MapperBase {
    $import?: 'all';
    [prop:string]: string | boolean | ArrMapper;
}
*/

export interface ArrMapper extends Mapper {
    $name?: string;
}

export interface Mapper {
    //all?: boolean;
    [prop:string]: string | boolean | number | ArrMapper;
}
