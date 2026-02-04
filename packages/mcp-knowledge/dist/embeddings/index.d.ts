import { DocumentChunk, ChunkMetadata } from '../types.js';
export interface SearchResult {
    id: string;
    content: string;
    metadata: ChunkMetadata;
    distance: number;
}
export interface EmbeddingsConfig {
    openaiApiKey: string;
    chromaPath?: string;
    collectionName?: string;
    embeddingModel?: string;
}
export declare class EmbeddingsManager {
    private client;
    private collection;
    private openai;
    private collectionName;
    private embeddingModel;
    constructor(config: EmbeddingsConfig);
    initialize(): Promise<void>;
    private generateChunkId;
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    chunkText(text: string, maxTokens?: number): string[];
    addDocument(content: string, metadata: ChunkMetadata): Promise<string[]>;
    addChunks(chunks: DocumentChunk[]): Promise<void>;
    search(query: string, options?: {
        limit?: number;
        filter?: Partial<ChunkMetadata>;
    }): Promise<SearchResult[]>;
    deleteByUrl(url: string): Promise<void>;
    clear(): Promise<void>;
    count(): Promise<number>;
}
//# sourceMappingURL=index.d.ts.map