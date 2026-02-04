import { z } from 'zod';

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  markdown: string;
  images: CrawledImage[];
  codeBlocks: CodeBlock[];
  links: string[];
  crawledAt: Date;
}

export interface CrawledImage {
  url: string;
  alt: string;
  localPath: string;
  description?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  context: string;
}

export interface OpenAPISpec {
  url: string;
  spec: Record<string, unknown>;
  endpoints: APIEndpoint[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description: string;
  schema: Record<string, unknown>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  url: string;
  type: 'doc' | 'example' | 'api';
  section: string;
  language?: string;
  title?: string;
}

export const CrawlerConfigSchema = z.object({
  baseUrl: z.string().url().default('https://developers.eduzz.com/'),
  maxDepth: z.number().int().positive().default(10000),
  domainFilter: z.string().default('developers.eduzz.com'),
  concurrency: z.number().int().positive().default(5),
  delay: z.number().int().nonnegative().default(500),
});

export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema>;

export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  baseUrl: 'https://developers.eduzz.com/',
  maxDepth: 10000,
  domainFilter: 'developers.eduzz.com',
  concurrency: 5,
  delay: 500,
};
