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
    private unpackRow;
    private unpackArr;
}
export declare const faceSchemas: FaceSchemas;
export {};
