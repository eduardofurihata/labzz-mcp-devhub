import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';
/**
 * Local embeddings manager that stores vectors in a JSON file.
 * This is a lightweight alternative to ChromaDB for simpler deployments.
 */
export class LocalEmbeddingsManager {
    openai;
    storagePath;
    dbPath;
    embeddingModel;
    db;
    constructor(config) {
        this.openai = new OpenAI({ apiKey: config.openaiApiKey });
        this.storagePath = config.storagePath;
        this.dbPath = join(config.storagePath, 'knowledge.db.json');
        this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
        if (!existsSync(this.storagePath)) {
            mkdirSync(this.storagePath, { recursive: true });
        }
        this.db = this.loadDatabase();
    }
    loadDatabase() {
        if (existsSync(this.dbPath)) {
            try {
                const content = readFileSync(this.dbPath, 'utf-8');
                return JSON.parse(content);
            }
            catch {
                return this.createEmptyDatabase();
            }
        }
        return this.createEmptyDatabase();
    }
    createEmptyDatabase() {
        return {
            documents: [],
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
        };
    }
    saveDatabase() {
        this.db.lastUpdated = new Date().toISOString();
        writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
    }
    generateChunkId(content, metadata) {
        const hash = createHash('md5')
            .update(content + JSON.stringify(metadata))
            .digest('hex');
        return hash.substring(0, 16);
    }
    async generateEmbedding(text) {
        const response = await this.openai.embeddings.create({
            model: this.embeddingModel,
            input: text,
        });
        return response.data[0].embedding;
    }
    async generateEmbeddings(texts) {
        const batchSize = 100;
        const embeddings = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const response = await this.openai.embeddings.create({
                model: this.embeddingModel,
                input: batch,
            });
            embeddings.push(...response.data.map((d) => d.embedding));
            if (i + batchSize < texts.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        return embeddings;
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    chunkText(text, maxTokens = 500) {
        const chunks = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        let currentTokens = 0;
        for (const sentence of sentences) {
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
    async addDocument(content, metadata) {
        const chunks = this.chunkText(content);
        const ids = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkMetadata = {
                ...metadata,
                section: `${metadata.section}_chunk_${i}`,
            };
            const id = this.generateChunkId(chunk, chunkMetadata);
            // Skip if already exists
            if (this.db.documents.some((d) => d.id === id)) {
                ids.push(id);
                continue;
            }
            const embedding = await this.generateEmbedding(chunk);
            this.db.documents.push({
                id,
                content: chunk,
                metadata: chunkMetadata,
                embedding,
            });
            ids.push(id);
        }
        this.saveDatabase();
        return ids;
    }
    async addChunks(chunks) {
        const newChunks = chunks.filter((c) => !this.db.documents.some((d) => d.id === c.id));
        if (newChunks.length === 0)
            return;
        const embeddings = await this.generateEmbeddings(newChunks.map((c) => c.content));
        for (let i = 0; i < newChunks.length; i++) {
            this.db.documents.push({
                id: newChunks[i].id,
                content: newChunks[i].content,
                metadata: newChunks[i].metadata,
                embedding: embeddings[i],
            });
        }
        this.saveDatabase();
    }
    async search(query, options = {}) {
        const { limit = 10, filter } = options;
        const queryEmbedding = await this.generateEmbedding(query);
        let candidates = this.db.documents;
        // Apply filters
        if (filter) {
            candidates = candidates.filter((doc) => {
                for (const [key, value] of Object.entries(filter)) {
                    if (value !== undefined && doc.metadata[key] !== value) {
                        return false;
                    }
                }
                return true;
            });
        }
        // Calculate similarities
        const scored = candidates.map((doc) => ({
            ...doc,
            similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
        }));
        // Sort by similarity (descending) and take top results
        scored.sort((a, b) => b.similarity - a.similarity);
        const topResults = scored.slice(0, limit);
        return topResults.map((doc) => ({
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
            distance: 1 - doc.similarity, // Convert similarity to distance
        }));
    }
    deleteByUrl(url) {
        this.db.documents = this.db.documents.filter((d) => d.metadata.url !== url);
        this.saveDatabase();
    }
    clear() {
        this.db = this.createEmptyDatabase();
        this.saveDatabase();
    }
    count() {
        return this.db.documents.length;
    }
}
//# sourceMappingURL=local-client.js.map