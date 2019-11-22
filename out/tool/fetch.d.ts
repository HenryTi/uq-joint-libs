import { Headers } from 'node-fetch';
export declare abstract class Fetch {
    private baseUrl;
    constructor(baseUrl?: string);
    initBaseUrl(baseUrl: string): void;
    protected get(url: string, params?: any): Promise<any>;
    protected post(url: string, params: any): Promise<any>;
    protected appendHeaders(headers: Headers): void;
    protected innerFetch(url: string, method: string, body?: any): Promise<any>;
}
