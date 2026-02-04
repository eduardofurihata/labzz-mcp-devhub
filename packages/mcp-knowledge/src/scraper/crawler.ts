import { chromium, Browser, Page } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import TurndownService from 'turndown';
import {
  CrawledPage,
  CrawledImage,
  CodeBlock,
  CrawlerConfig,
  DEFAULT_CRAWLER_CONFIG,
} from '../types.js';

export class Crawler {
  private config: CrawlerConfig;
  private browser: Browser | null = null;
  private visited: Set<string> = new Set();
  private queue: string[] = [];
  private turndown: TurndownService;
  private outputDir: string;

  constructor(outputDir: string, config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CRAWLER_CONFIG, ...config };
    this.outputDir = outputDir;
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Create output directories
    const dirs = ['pages', 'images', 'code-examples', 'openapi'];
    for (const dir of dirs) {
      const path = join(outputDir, 'raw', dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }
  }

  private generateId(url: string): string {
    return createHash('md5').update(url).digest('hex').substring(0, 12);
  }

  private normalizeUrl(url: string, baseUrl: string): string | null {
    try {
      const parsed = new URL(url, baseUrl);

      // Only allow same domain
      if (!parsed.hostname.includes(this.config.domainFilter)) {
        return null;
      }

      // Remove hash and trailing slash
      parsed.hash = '';
      let normalized = parsed.toString();
      if (normalized.endsWith('/') && normalized !== this.config.baseUrl) {
        normalized = normalized.slice(0, -1);
      }

      return normalized;
    } catch {
      return null;
    }
  }

  private async extractImages(page: Page, pageUrl: string): Promise<CrawledImage[]> {
    const images: CrawledImage[] = [];

    const imgElements = await page.locator('img').all();
    for (const img of imgElements) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt') || '';

      if (src) {
        const imgUrl = this.normalizeUrl(src, pageUrl);
        if (imgUrl) {
          const id = this.generateId(imgUrl);
          const ext = imgUrl.split('.').pop()?.split('?')[0] || 'png';
          const localPath = join(this.outputDir, 'raw', 'images', `${id}.${ext}`);

          images.push({
            url: imgUrl,
            alt,
            localPath,
          });
        }
      }
    }

    return images;
  }

  private async extractCodeBlocks(page: Page): Promise<CodeBlock[]> {
    const codeBlocks: CodeBlock[] = [];

    const codeElements = await page.locator('pre code, pre').all();
    for (const code of codeElements) {
      const text = await code.textContent();
      if (!text) continue;

      // Try to detect language from class
      const className = await code.getAttribute('class') || '';
      let language = 'text';

      const langMatch = className.match(/language-(\w+)|lang-(\w+)|(\w+)/);
      if (langMatch) {
        language = langMatch[1] || langMatch[2] || langMatch[3] || 'text';
      }

      // Get surrounding context from previous sibling text
      let context = '';
      try {
        const parentLocator = page.locator('pre code, pre').filter({ has: code }).locator('..');
        const prevSibling = parentLocator.locator('xpath=preceding-sibling::*[1]');
        if (await prevSibling.count() > 0) {
          const siblingText = await prevSibling.textContent();
          context = siblingText?.substring(0, 200) || '';
        }
      } catch {
        // Context extraction is optional
      }

      codeBlocks.push({
        language,
        code: text.trim(),
        context,
      });
    }

    return codeBlocks;
  }

  private async extractLinks(page: Page, pageUrl: string): Promise<string[]> {
    const links: string[] = [];

    const anchors = await page.locator('a[href]').all();
    for (const anchor of anchors) {
      const href = await anchor.getAttribute('href');
      if (href) {
        const normalized = this.normalizeUrl(href, pageUrl);
        if (normalized && !this.visited.has(normalized)) {
          links.push(normalized);
        }
      }
    }

    return [...new Set(links)];
  }

  private async crawlPage(page: Page, url: string): Promise<CrawledPage | null> {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const title = await page.title();
      const content = await page.content();

      // Extract main content area
      const mainSelectors = ['main', 'article', '.content', '.documentation', '#content'];
      let htmlContent = '';

      for (const selector of mainSelectors) {
        const mainContent = page.locator(selector).first();
        if (await mainContent.count() > 0) {
          htmlContent = await mainContent.innerHTML();
          break;
        }
      }

      if (!htmlContent) {
        htmlContent = await page.locator('body').innerHTML();
      }

      const markdown = this.turndown.turndown(htmlContent);
      const images = await this.extractImages(page, url);
      const codeBlocks = await this.extractCodeBlocks(page);
      const links = await this.extractLinks(page, url);

      return {
        url,
        title,
        content,
        markdown,
        images,
        codeBlocks,
        links,
        crawledAt: new Date(),
      };
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return null;
    }
  }

  private async downloadImage(url: string, localPath: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        writeFileSync(localPath, Buffer.from(buffer));
      }
    } catch (error) {
      console.error(`Error downloading image ${url}:`, error);
    }
  }

  private savePage(crawled: CrawledPage): void {
    const id = this.generateId(crawled.url);

    // Save markdown
    const mdPath = join(this.outputDir, 'raw', 'pages', `${id}.md`);
    const mdContent = `---
url: ${crawled.url}
title: ${crawled.title}
crawledAt: ${crawled.crawledAt.toISOString()}
---

# ${crawled.title}

${crawled.markdown}
`;
    writeFileSync(mdPath, mdContent, 'utf-8');

    // Save code examples
    if (crawled.codeBlocks.length > 0) {
      const examplesPath = join(this.outputDir, 'raw', 'code-examples', `${id}.json`);
      writeFileSync(
        examplesPath,
        JSON.stringify(
          {
            url: crawled.url,
            examples: crawled.codeBlocks,
          },
          null,
          2
        ),
        'utf-8'
      );
    }
  }

  async crawl(onProgress?: (url: string, total: number) => void): Promise<CrawledPage[]> {
    const results: CrawledPage[] = [];

    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (compatible; EduzzMCPBot/1.0; +https://github.com/eduzz/mcp-knowledge)',
    });

    const page = await context.newPage();

    this.queue.push(this.config.baseUrl);

    let processedCount = 0;

    while (this.queue.length > 0 && processedCount < this.config.maxDepth) {
      const url = this.queue.shift()!;

      if (this.visited.has(url)) continue;
      this.visited.add(url);

      if (onProgress) {
        onProgress(url, processedCount + 1);
      }

      const crawled = await this.crawlPage(page, url);
      if (crawled) {
        results.push(crawled);
        this.savePage(crawled);

        // Download images
        for (const img of crawled.images) {
          if (!existsSync(img.localPath)) {
            await this.downloadImage(img.url, img.localPath);
          }
        }

        // Add new links to queue
        for (const link of crawled.links) {
          if (!this.visited.has(link) && !this.queue.includes(link)) {
            this.queue.push(link);
          }
        }

        processedCount++;
      }

      // Respect rate limiting
      await new Promise((resolve) => setTimeout(resolve, this.config.delay));
    }

    await this.browser.close();
    this.browser = null;

    return results;
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
