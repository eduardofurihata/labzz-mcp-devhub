import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
// Dynamic import for transformers.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedder = null;
/**
 * Local embeddings manager using Transformers.js
 * No API key required - runs 100% locally
 */
export class LocalEmbeddings {
    storagePath;
    dbPath;
    modelName;
    db;
    initialized = false;
    constructor(config) {
        this.storagePath = config.storagePath;
        this.dbPath = join(config.storagePath, 'knowledge.db.json');
        this.modelName = config.modelName || 'Xenova/all-MiniLM-L6-v2';
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
    async initialize() {
        if (this.initialized)
            return;
        console.log('Loading local embedding model (first run may take a moment to download)...');
        // Dynamic import to avoid issues with ESM
        const { pipeline } = await import('@xenova/transformers');
        embedder = await pipeline('feature-extraction', this.modelName, {
            quantized: true, // Use quantized model for faster inference
        });
        this.initialized = true;
        console.log('Embedding model loaded successfully!');
    }
    async generateEmbedding(text) {
        if (!embedder) {
            throw new Error('Embedder not initialized. Call initialize() first.');
        }
        const result = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }
    async generateEmbeddings(texts) {
        const embeddings = [];
        for (let i = 0; i < texts.length; i++) {
            const embedding = await this.generateEmbedding(texts[i]);
            embeddings.push(embedding);
            // Progress indicator for large batches
            if (texts.length > 10 && (i + 1) % 10 === 0) {
                console.log(`Embedding progress: ${i + 1}/${texts.length}`);
            }
        }
        return embeddings;
    }
    generateChunkId(content, metadata) {
        const hash = createHash('md5')
            .update(content + JSON.stringify(metadata))
            .digest('hex');
        return hash.substring(0, 16);
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
        await this.initialize();
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
        await this.initialize();
        const newChunks = chunks.filter((c) => !this.db.documents.some((d) => d.id === c.id));
        if (newChunks.length === 0)
            return;
        console.log(`Generating embeddings for ${newChunks.length} chunks...`);
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
        await this.initialize();
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
//# sourceMappingURL=local-embeddings.js.map