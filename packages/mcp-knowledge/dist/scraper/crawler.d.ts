import { CrawledPage, CrawlerConfig } from '../types.js';
export declare class Crawler {
    private config;
    private browser;
    private visited;
    private queue;
    private turndown;
    private outputDir;
    constructor(outputDir: string, config?: Partial<CrawlerConfig>);
    private generateId;
    private normalizeUrl;
    private extractImages;
    private extractCodeBlocks;
    private extractLinks;
    private crawlPage;
    private downloadImage;
    private savePage;
    crawl(onProgress?: (url: string, total: number) => void): Promise<CrawledPage[]>;
    stop(): Promise<void>;
}
//# sourceMappingURL=crawler.d.ts.map