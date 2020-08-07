declare class FaceSchemas {
    private busSchemas;
    private faceSchemas;
    packBusData(faceName: string, data: any): Promise<string>;
    unpackBusData(faceName: string, data: string): Promise<any>;
    private getFaceSchema;
    private faceSchemaFromBus;
    private buildFaceSchema;
    private getBusSchema;
    private pack;
    private packBusMain;
    private escape;
    private packRow;
    private packArr;
    private unpack;
    /**
     *
     * @param ret
     * @param fields
     * @param data
     * @param p
     */
    private unpackRow;
    /**
     *
     * @param ret 解析的结果存入ret中
     * @param arr arr的schema
     * @param data 要解析的数据
     * @param p 要解析的arr在data中的起始位置
     */
    private unpackArr;
}
export declare const faceSchemas: FaceSchemas;
export {};
