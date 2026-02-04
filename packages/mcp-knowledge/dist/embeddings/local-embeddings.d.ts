import { DocumentChunk, ChunkMetadata } from '../types.js';
export interface SearchResult {
    id: string;
    content: string;
    metadata: ChunkMetadata;
    distance: number;
}
export interface LocalEmbeddingsConfig {
    storagePath: string;
    modelName?: string;
}
/**
 * Local embeddings manager using Transformers.js
 * No API key required - runs 100% locally
 */
export declare class LocalEmbeddings {
    private storagePath;
    private dbPath;
    private modelName;
    private db;
    private initialized;
    constructor(config: LocalEmbeddingsConfig);
    private loadDatabase;
    private createEmptyDatabase;
    private saveDatabase;
    initialize(): Promise<void>;
    private generateEmbedding;
    private generateEmbeddings;
    private generateChunkId;
    private cosineSimilarity;
    chunkText(text: string, maxTokens?: number): string[];
    addDocument(content: string, metadata: ChunkMetadata): Promise<string[]>;
    addChunks(chunks: DocumentChunk[]): Promise<void>;
    search(query: string, options?: {
        limit?: number;
        filter?: Partial<ChunkMetadata>;
    }): Promise<SearchResult[]>;
    deleteByUrl(url: string): void;
    clear(): void;
    count(): number;
}
//# sourceMappingURL=local-embeddings.d.ts.map