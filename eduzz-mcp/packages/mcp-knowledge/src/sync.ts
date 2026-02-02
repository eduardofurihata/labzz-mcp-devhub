import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { Crawler } from './scraper/crawler.js';
import { CodeProcessor, ImageProcessor, OpenAPIProcessor } from './processors/index.js';
import { LocalEmbeddings } from './embeddings/local-embeddings.js';
import { ChunkMetadata, CrawledPage, DocumentChunk } from './types.js';
import { createHash } from 'node:crypto';

export interface SyncOptions {
  force?: boolean;
  openaiApiKey?: string;  // Optional - for AI image descriptions
  anthropicApiKey?: string;  // Optional - for AI image descriptions
  onProgress?: (message: string) => void;
}

export interface SyncResult {
  pagesProcessed: number;
  imagesProcessed: number;
  codeExamplesProcessed: number;
  chunksIndexed: number;
  errors: string[];
}

export class KnowledgeSyncer {
  private baseDir: string;
  private codeProcessor: CodeProcessor;

  constructor() {
    this.baseDir = join(homedir(), '.eduzz-mcp');
    this.codeProcessor = new CodeProcessor();

    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    const { force = false, openaiApiKey, anthropicApiKey, onProgress } = options;

    const result: SyncResult = {
      pagesProcessed: 0,
      imagesProcessed: 0,
      codeExamplesProcessed: 0,
      chunksIndexed: 0,
      errors: [],
    };

    const log = (msg: string) => {
      if (onProgress) onProgress(msg);
      console.log(msg);
    };

    try {
      // Step 1: Crawl the documentation site
      log('Starting crawl of developers.eduzz.com...');
      const crawler = new Crawler(this.baseDir);
      const pages = await crawler.crawl((url, count) => {
        log(`[${count}] Crawling: ${url}`);
      });
      result.pagesProcessed = pages.length;
      log(`Crawled ${pages.length} pages`);

      // Step 2: Process images
      log('Processing images...');
      const imageProcessor = new ImageProcessor();
      const allImages = pages.flatMap((p) => p.images);

      if (allImages.length > 0) {
        // Use AI descriptions if API keys provided, otherwise use alt text
        if (openaiApiKey || anthropicApiKey) {
          await imageProcessor.processImagesWithAI(allImages, { openaiApiKey, anthropicApiKey });
          log(`Processed ${allImages.length} images with AI descriptions`);
        } else {
          await imageProcessor.processImages(allImages);
          log(`Processed ${allImages.length} images (using alt text)`);
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

      if (force) {
        log('Force sync: clearing existing index...');
        embeddings.clear();
      }

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

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      log(`Error during sync: ${errorMsg}`);
    }

    return result;
  }

  private findOpenAPILinks(pages: CrawledPage[]): string[] {
    const openApiUrls: string[] = [];

    for (const page of pages) {
      // Look for OpenAPI/Swagger links in markdown
      const matches = page.markdown.matchAll(
        /https?:\/\/[^\s)]+(?:openapi|swagger|api-docs)[^\s)]*.(?:json|yaml|yml)/gi
      );
      for (const match of matches) {
        openApiUrls.push(match[0]);
      }

      // Check links that might be OpenAPI specs
      for (const link of page.links) {
        if (
          link.includes('openapi') ||
          link.includes('swagger') ||
          link.includes('api-docs') ||
          link.endsWith('.json') ||
          link.endsWith('.yaml') ||
          link.endsWith('.yml')
        ) {
          openApiUrls.push(link);
        }
      }
    }

    return [...new Set(openApiUrls)];
  }

  private createChunks(pages: CrawledPage[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    for (const page of pages) {
      const url = page.url;
      const title = page.title;

      // Split content into sections by headers
      const sections = page.markdown.split(/(?=^#{1,3}\s)/m);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section || section.length < 50) continue;

        const sectionTitle = section.match(/^#{1,3}\s+(.+)/)?.[1] || `section_${i}`;
        const id = createHash('md5')
          .update(url + section)
          .digest('hex')
          .substring(0, 16);

        const metadata: ChunkMetadata = {
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

  private createCodeChunks(pages: CrawledPage[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    for (const page of pages) {
      const processed = this.codeProcessor.processCodeBlocks(page.codeBlocks);

      for (const code of processed) {
        const id = createHash('md5')
          .update(page.url + code.code)
          .digest('hex')
          .substring(0, 16);

        const content = `${code.context}\n\n\`\`\`${code.language}\n${code.code}\n\`\`\``;

        const metadata: ChunkMetadata = {
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

  getStoragePath(): string {
    return this.baseDir;
  }
}
