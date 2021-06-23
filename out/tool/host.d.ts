export declare const isDevelopment: boolean;
declare class Host {
    /**
     * 是中心服务器的起始baseurl
     */
    centerUrl: string;
    ws: string;
    resHost: string;
    /**
     * 设置centerApi的buseUrl
     */
    start(): Promise<void>;
    private debugHostUrl;
    /**
     * 这个好像什么也没干啊？
     */
    private tryLocal;
    /**
     *
     * @returns center host的地址，来自配置文件的centerhost项
     */
    private getCenterHost;
    private getResHost;
    getUrlOrDebug(url: string, debugHost?: string): string;
    getUrlOrTest(db: string, url: string, urlTest: string): string;
    getUqUrl(db: string, url: string): string;
    localCheck(urlDebug: string): Promise<boolean>;
}
export declare const host: Host;
export {};
