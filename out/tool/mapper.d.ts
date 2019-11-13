export interface ArrMapper extends Mapper {
    $name?: string;
}
export interface Mapper {
    [prop: string]: string | boolean | number | ArrMapper;
}
