import { ChromaClient, Collection } from 'chromadb';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';
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

export class EmbeddingsManager {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private openai: OpenAI;
  private collectionName: string;
  private embeddingModel: string;

  constructor(config: EmbeddingsConfig) {
    this.client = new ChromaClient({
      path: config.chromaPath || 'http://localhost:8000',
    });
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.collectionName = config.collectionName || 'eduzz-knowledge';
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
  }

  async initialize(): Promise<void> {
    this.collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
      metadata: {
        description: 'Eduzz API documentation and knowledge base',
      },
    });
  }

  private generateChunkId(content: string, metadata: ChunkMetadata): string {
    const hash = createHash('md5')
      .update(content + JSON.stringify(metadata))
      .digest('hex');
    return hash.substring(0, 16);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: batch,
      });
      embeddings.push(...response.data.map((d) => d.embedding));

      // Rate limiting
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return embeddings;
  }

  chunkText(text: string, maxTokens: number = 500): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      // Rough token estimation (1 token ≈ 4 chars)
      const sentenceTokens = Math.ceil(sentence.length / 4);

      if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }

      currentChunk += sentence + ' ';
      currentTokens += sentenceTokens;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async addDocument(content: string, metadata: ChunkMetadata): Promise<string[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    const chunks = this.chunkText(content);
    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: ChunkMetadata[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkMetadata = {
        ...metadata,
        section: `${metadata.section}_chunk_${i}`,
      };
      const id = this.generateChunkId(chunk, chunkMetadata);

      ids.push(id);
      documents.push(chunk);
      metadatas.push(chunkMetadata);
    }

    const embeddings = await this.generateEmbeddings(documents);

    await this.collection.add({
      ids,
      documents,
      metadatas: metadatas as unknown as Record<string, string | number | boolean>[],
      embeddings,
    });

    return ids;
  }

  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    const batchSize = 100;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.generateEmbeddings(batch.map((c) => c.content));

      await this.collection.add({
        ids: batch.map((c) => c.id),
        documents: batch.map((c) => c.content),
        metadatas: batch.map((c) => c.metadata as unknown as Record<string, string | number | boolean>),
        embeddings,
      });
    }
  }

  async search(
    query: string,
    options: {
      limit?: number;
      filter?: Partial<ChunkMetadata>;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    const { limit = 10, filter } = options;
    const queryEmbedding = await this.generateEmbedding(query);

    const whereClause = filter
      ? Object.entries(filter).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        )
      : undefined;

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: whereClause as Record<string, string | number | boolean> | undefined,
    });

    if (!results.ids[0]) {
      return [];
    }

    return results.ids[0].map((id, index) => ({
      id,
      content: results.documents?.[0]?.[index] || '',
      metadata: (results.metadatas?.[0]?.[index] || {}) as ChunkMetadata,
      distance: results.distances?.[0]?.[index] || 0,
    }));
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    await this.collection.delete({
      where: { url } as Record<string, string>,
    });
  }

  async clear(): Promise<void> {
    await this.client.deleteCollection({ name: this.collectionName });
    this.collection = await this.client.createCollection({
      name: this.collectionName,
      metadata: {
        description: 'Eduzz API documentation and knowledge base',
      },
    });
  }

  async count(): Promise<number> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    return await this.collection.count();
  }
}
