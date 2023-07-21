export declare const isDevelopment: boolean;
declare class Host {
    /**
     * 是中心服务器的起始baseurl
     */
    centerUrl: string;
    ws: string;
    resHost: string;
    /**
     * 设置centerApi的buseUrl，所有待用uq的接口均通过该对象的方法
     */
    start(): Promise<void>;
    private debugHostUrl;
    /**
     * 测试并设置各种host是否可用（即设置全局常量hosts各属性的local值，true为可用，否则不可用）
     */
    private tryLocal;
    /**
     *
     * @returns center host的地址，来自配置文件的centerhost项
     */
    private getCenterHost;
    private getResHost;
    /**
     *
     * @param url
     * @param debugHost
     * @returns
     */
    getUrlOrDebug(url: string, debugHost?: string): string;
    getUrlOrTest(db: string, url: string, urlTest: string): string;
    /**
     * 根据uq对应的db名称及其所在服务器的地址，拼接出该uq的根url地址
     * @param db
     * @param url
     * @returns
     */
    getUqUrl(db: string, url: string): string;
    localCheck(urlDebug: string): Promise<boolean>;
}
export declare const host: Host;
export {};
