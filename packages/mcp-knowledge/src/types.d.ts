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
export declare const CrawlerConfigSchema: z.ZodObject<{
    baseUrl: z.ZodDefault<z.ZodString>;
    maxDepth: z.ZodDefault<z.ZodNumber>;
    domainFilter: z.ZodDefault<z.ZodString>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    delay: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    maxDepth: number;
    domainFilter: string;
    concurrency: number;
    delay: number;
}, {
    baseUrl?: string | undefined;
    maxDepth?: number | undefined;
    domainFilter?: string | undefined;
    concurrency?: number | undefined;
    delay?: number | undefined;
}>;
export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema>;
export declare const DEFAULT_CRAWLER_CONFIG: CrawlerConfig;
//# sourceMappingURL=types.d.ts.map