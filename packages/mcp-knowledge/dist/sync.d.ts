export interface SyncOptions {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    onProgress?: (message: string) => void;
}
export interface SyncResult {
    pagesProcessed: number;
    imagesProcessed: number;
    codeExamplesProcessed: number;
    chunksIndexed: number;
    errors: string[];
}
export declare class KnowledgeSyncer {
    private baseDir;
    private codeProcessor;
    constructor();
    sync(options?: SyncOptions): Promise<SyncResult>;
    private findOpenAPILinks;
    private createChunks;
    private createCodeChunks;
    getStoragePath(): string;
}
//# sourceMappingURL=sync.d.ts.map