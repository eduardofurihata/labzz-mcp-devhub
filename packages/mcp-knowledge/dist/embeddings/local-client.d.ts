import { DocumentChunk, ChunkMetadata } from '../types.js';
import { SearchResult } from './index.js';
export interface LocalEmbeddingsConfig {
    openaiApiKey: string;
    storagePath: string;
    embeddingModel?: string;
}
/**
 * Local embeddings manager that stores vectors in a JSON file.
 * This is a lightweight alternative to ChromaDB for simpler deployments.
 */
export declare class LocalEmbeddingsManager {
    private openai;
    private storagePath;
    private dbPath;
    private embeddingModel;
    private db;
    constructor(config: LocalEmbeddingsConfig);
    private loadDatabase;
    private createEmptyDatabase;
    private saveDatabase;
    private generateChunkId;
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
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
//# sourceMappingURL=local-client.d.ts.map