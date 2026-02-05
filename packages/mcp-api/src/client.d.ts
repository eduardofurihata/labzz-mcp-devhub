import { APIClientConfig, APIResponse, RequestOptions, RateLimitInfo } from './types.js';
export declare class EduzzAPIClient {
    private config;
    private rateLimitInfo;
    constructor(config: APIClientConfig);
    private getBaseUrl;
    private generateSignature;
    private buildUrl;
    private parseRateLimitHeaders;
    getRateLimitInfo(): RateLimitInfo | null;
    request<T = unknown>(options: RequestOptions): Promise<APIResponse<T>>;
    private delay;
    get<T = unknown>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<APIResponse<T>>;
    post<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>>;
    put<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>>;
    patch<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>>;
    delete<T = unknown>(path: string): Promise<APIResponse<T>>;
}
//# sourceMappingURL=client.d.ts.map