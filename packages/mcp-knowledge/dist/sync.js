import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Crawler } from './scraper/crawler.js';
import { CodeProcessor, ImageProcessor, OpenAPIProcessor } from './processors/index.js';
import { LocalEmbeddings } from './embeddings/local-embeddings.js';
import { createHash } from 'node:crypto';
import { getDataDir } from './paths.js';
export class KnowledgeSyncer {
    baseDir;
    codeProcessor;
    constructor() {
        this.baseDir = getDataDir();
        this.codeProcessor = new CodeProcessor();
        if (!existsSync(this.baseDir)) {
            mkdirSync(this.baseDir, { recursive: true });
        }
    }
    async sync(options = {}) {
        const { openaiApiKey, anthropicApiKey, onProgress } = options;
        const result = {
            pagesProcessed: 0,
            imagesProcessed: 0,
            codeExamplesProcessed: 0,
            chunksIndexed: 0,
            errors: [],
        };
        const log = (msg) => {
            if (onProgress)
                onProgress(msg);
            console.log(msg);
        };
        try {
            // Step 0: Clean existing data
            log('Cleaning existing data...');
            const rawDir = join(this.baseDir, 'raw');
            if (existsSync(rawDir)) {
                rmSync(rawDir, { recursive: true, force: true });
            }
            mkdirSync(rawDir, { recursive: true });
            // Step 1: Crawl the documentation site
            log('Starting crawl of developers.eduzz.com...');
            const crawler = new Crawler(this.baseDir);
            const pages = await crawler.crawl((url, count) => {
                log(`[${count}] Crawling: ${url}`);
            });
            result.pagesProcessed = pages.length;
            log(`Crawled ${pages.length} pages`);
            // Step 2: Process images with OCR (offline, no API needed)
            log('Processing images with OCR...');
            const imageProcessor = new ImageProcessor();
            const allImages = pages.flatMap((p) => p.images);
            if (allImages.length > 0) {
                // Always use OCR by default (100% offline)
                // AI descriptions are optional enhancement if API keys provided
                if (openaiApiKey || anthropicApiKey) {
                    log('Using AI for enhanced image descriptions...');
                    await imageProcessor.processImagesWithAI(allImages, { openaiApiKey, anthropicApiKey });
                    log(`Processed ${allImages.length} images with AI descriptions`);
                }
                else {
                    // OCR extracts text from images offline
                    await imageProcessor.processImages(allImages);
                    log(`Processed ${allImages.length} images with OCR`);
                }
                result.imagesProcessed = allImages.length;
            }
            // Step 3: Check for OpenAPI specs
            log('Looking for OpenAPI specs...');
            const openApiProcessor = new OpenAPIProcessor(this.baseDir);
            const openApiUrls = this.findOpenAPILinks(pages);
            for (const url of openApiUrls) {
                log(`Processing OpenAPI spec: ${url}`);
                await openApiProcessor.processSpec(url);
            }
            // Step 4: Index everything with local embeddings (no API key needed!)
            log('Indexing content for semantic search (using local embeddings)...');
            const embeddings = new LocalEmbeddings({
                storagePath: this.baseDir,
            });
            // Sempre limpa o índice antes de reconstruir
            log('Clearing existing index...');
            embeddings.clear();
            // Initialize embeddings (downloads model on first run)
            await embeddings.initialize();
            // Index page content
            const chunks = this.createChunks(pages);
            await embeddings.addChunks(chunks);
            result.chunksIndexed = chunks.length;
            // Index code examples
            const codeChunks = this.createCodeChunks(pages);
            await embeddings.addChunks(codeChunks);
            result.codeExamplesProcessed = codeChunks.length;
            result.chunksIndexed += codeChunks.length;
            log(`Indexed ${result.chunksIndexed} chunks`);
            log('Sync complete!');
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(errorMsg);
            log(`Error during sync: ${errorMsg}`);
        }
        return result;
    }
    findOpenAPILinks(pages) {
        const openApiUrls = [];
        for (const page of pages) {
            // Look for OpenAPI/Swagger links in markdown
            const matches = page.markdown.matchAll(/https?:\/\/[^\s)]+(?:openapi|swagger|api-docs)[^\s)]*.(?:json|yaml|yml)/gi);
            for (const match of matches) {
                openApiUrls.push(match[0]);
            }
            // Check links that might be OpenAPI specs
            for (const link of page.links) {
                if (link.includes('openapi') ||
                    link.includes('swagger') ||
                    link.includes('api-docs') ||
                    link.endsWith('.json') ||
                    link.endsWith('.yaml') ||
                    link.endsWith('.yml')) {
                    openApiUrls.push(link);
                }
            }
        }
        return [...new Set(openApiUrls)];
    }
    createChunks(pages) {
        const chunks = [];
        for (const page of pages) {
            const url = page.url;
            const title = page.title;
            // Split content into sections by headers
            const sections = page.markdown.split(/(?=^#{1,3}\s)/m);
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i].trim();
                if (!section || section.length < 50)
                    continue;
                const sectionTitle = section.match(/^#{1,3}\s+(.+)/)?.[1] || `section_${i}`;
                const id = createHash('md5')
                    .update(url + section)
                    .digest('hex')
                    .substring(0, 16);
                const metadata = {
                    url,
                    type: 'doc',
                    section: sectionTitle,
                    title,
                };
                chunks.push({
                    id,
                    content: section,
                    metadata,
                });
            }
        }
        return chunks;
    }
    createCodeChunks(pages) {
        const chunks = [];
        for (const page of pages) {
            const processed = this.codeProcessor.processCodeBlocks(page.codeBlocks);
            for (const code of processed) {
                const id = createHash('md5')
                    .update(page.url + code.code)
                    .digest('hex')
                    .substring(0, 16);
                const content = `${code.context}\n\n\`\`\`${code.language}\n${code.code}\n\`\`\``;
                const metadata = {
                    url: page.url,
                    type: 'example',
                    section: code.category,
                    language: code.language,
                    title: page.title,
                };
                chunks.push({
                    id,
                    content,
                    metadata,
                });
            }
        }
        return chunks;
    }
    getStoragePath() {
        return this.baseDir;
    }
}
//# sourceMappingURL=sync.js.map