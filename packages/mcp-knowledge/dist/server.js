import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import cron from 'node-cron';
import { LocalEmbeddings } from './embeddings/local-embeddings.js';
import { OpenAPIProcessor } from './processors/openapi.js';
import { KnowledgeSyncer } from './sync.js';
import { getDataDir } from './paths.js';
export function createKnowledgeServer(config = {}) {
    const server = new McpServer({
        name: 'eduzz-knowledge',
        version: '1.0.0',
    });
    const baseDir = getDataDir();
    const embeddings = new LocalEmbeddings({
        storagePath: baseDir,
    });
    const openApiProcessor = new OpenAPIProcessor(baseDir);
    const syncer = new KnowledgeSyncer();
    // Schedule automatic sync
    const schedule = config.cronSchedule || '0 3 * * 0';
    cron.schedule(schedule, async () => {
        console.log('Running scheduled knowledge sync...');
        await syncer.sync({
            openaiApiKey: config.openaiApiKey,
            anthropicApiKey: config.anthropicApiKey,
        });
    });
    // Tool: Semantic search
    server.tool('eduzz_search', 'Search the Eduzz knowledge base using semantic search', {
        query: z.string().describe('Search query'),
        type: z.enum(['doc', 'example', 'api']).optional().describe('Filter by content type'),
        language: z.string().optional().describe('Filter code examples by programming language'),
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results'),
    }, async ({ query, type, language, limit }) => {
        try {
            const filter = {};
            if (type)
                filter.type = type;
            if (language)
                filter.language = language;
            const results = await embeddings.search(query, {
                limit,
                filter: Object.keys(filter).length > 0 ? filter : undefined,
            });
            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No results found. Try a different query or run eduzz_sync to update the knowledge base.',
                        },
                    ],
                };
            }
            const formatted = results
                .map((r, i) => {
                const meta = r.metadata;
                return `## Result ${i + 1}\n**URL:** ${meta.url}\n**Type:** ${meta.type}\n**Section:** ${meta.section}\n${meta.language ? `**Language:** ${meta.language}\n` : ''}\n${r.content}\n`;
            })
                .join('\n---\n\n');
            return {
                content: [
                    {
                        type: 'text',
                        text: formatted,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Get code examples
    server.tool('eduzz_get_example', 'Get code examples for a specific topic', {
        topic: z.string().describe('Topic to find examples for (e.g., "authentication", "webhooks")'),
        language: z.string().optional().describe('Programming language filter (e.g., "javascript", "php")'),
        limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of examples'),
    }, async ({ topic, language, limit }) => {
        try {
            const filter = { type: 'example' };
            if (language)
                filter.language = language.toLowerCase();
            const results = await embeddings.search(topic, { limit, filter });
            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No code examples found for "${topic}"${language ? ` in ${language}` : ''}.`,
                        },
                    ],
                };
            }
            const examples = results
                .map((r, i) => {
                return `### Example ${i + 1} (${r.metadata.language || 'unknown'})\nSource: ${r.metadata.url}\n\n${r.content}`;
            })
                .join('\n\n---\n\n');
            return {
                content: [
                    {
                        type: 'text',
                        text: examples,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Get endpoint documentation
    server.tool('eduzz_get_endpoint', 'Get documentation for a specific API endpoint', {
        path: z.string().describe('API endpoint path (e.g., "/invoices", "/users/{id}")'),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional().describe('HTTP method'),
    }, async ({ path, method }) => {
        try {
            const spec = openApiProcessor.loadCachedSpec();
            if (!spec) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'OpenAPI spec not found. Run eduzz_sync to fetch the API documentation.',
                        },
                    ],
                };
            }
            const endpoint = openApiProcessor.getEndpointDoc(spec, path, method);
            if (!endpoint) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Endpoint "${method || 'any'} ${path}" not found in API documentation.`,
                        },
                    ],
                };
            }
            const params = endpoint.parameters
                .map((p) => `  - \`${p.name}\` (${p.in}${p.required ? ', required' : ''}): ${p.description}`)
                .join('\n');
            const doc = `# ${endpoint.method} ${endpoint.path}

**Summary:** ${endpoint.summary}

${endpoint.description}

## Parameters
${params || 'No parameters'}

## Request Body
${endpoint.requestBody ? '```json\n' + JSON.stringify(endpoint.requestBody, null, 2) + '\n```' : 'No request body'}

## Responses
${Object.entries(endpoint.responses)
                .map(([code, resp]) => `### ${code}\n${JSON.stringify(resp, null, 2)}`)
                .join('\n\n')}
`;
            return {
                content: [
                    {
                        type: 'text',
                        text: doc,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Sync knowledge base
    server.tool('eduzz_sync', 'Synchronize the knowledge base by crawling the Eduzz documentation. WARNING: This deletes all existing data and rebuilds from scratch.', {}, async () => {
        try {
            const result = await syncer.sync({
                openaiApiKey: config.openaiApiKey,
                anthropicApiKey: config.anthropicApiKey,
                onProgress: (msg) => console.log(msg),
            });
            const summary = `Sync completed:
- Pages processed: ${result.pagesProcessed}
- Images processed: ${result.imagesProcessed}
- Code examples: ${result.codeExamplesProcessed}
- Chunks indexed: ${result.chunksIndexed}
${result.errors.length > 0 ? `\nErrors:\n${result.errors.join('\n')}` : ''}`;
            return {
                content: [
                    {
                        type: 'text',
                        text: summary,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // Tool: Get stats
    server.tool('eduzz_stats', 'Get statistics about the knowledge base', {}, async () => {
        const count = embeddings.count();
        const spec = openApiProcessor.loadCachedSpec();
        const pagesDir = join(baseDir, 'raw', 'pages');
        const imagesDir = join(baseDir, 'raw', 'images');
        let pageCount = 0;
        let imageCount = 0;
        if (existsSync(pagesDir)) {
            pageCount = readdirSync(pagesDir).filter((f) => f.endsWith('.md')).length;
        }
        if (existsSync(imagesDir)) {
            imageCount = readdirSync(imagesDir).filter((f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')).length;
        }
        const stats = `Knowledge Base Statistics:
- Indexed chunks: ${count}
- Crawled pages: ${pageCount}
- Downloaded images: ${imageCount}
- API endpoints: ${spec?.endpoints.length || 0}
- Storage path: ${baseDir}`;
        return {
            content: [
                {
                    type: 'text',
                    text: stats,
                },
            ],
        };
    });
    // Resources
    server.resource('eduzz-docs-overview', 'eduzz://docs/overview', async () => {
        const overviewPath = join(baseDir, 'raw', 'pages');
        if (!existsSync(overviewPath)) {
            return {
                contents: [
                    {
                        uri: 'eduzz://docs/overview',
                        mimeType: 'text/markdown',
                        text: 'No documentation available. Run eduzz_sync to fetch the documentation.',
                    },
                ],
            };
        }
        // Find main index/overview page
        const files = readdirSync(overviewPath);
        const indexFile = files.find((f) => f.includes('index') || f.includes('overview') || f.includes('getting-started'));
        if (indexFile) {
            const content = readFileSync(join(overviewPath, indexFile), 'utf-8');
            return {
                contents: [
                    {
                        uri: 'eduzz://docs/overview',
                        mimeType: 'text/markdown',
                        text: content,
                    },
                ],
            };
        }
        // List available pages
        const pageList = files
            .filter((f) => f.endsWith('.md'))
            .map((f) => `- ${f.replace('.md', '')}`)
            .join('\n');
        return {
            contents: [
                {
                    uri: 'eduzz://docs/overview',
                    mimeType: 'text/markdown',
                    text: `# Available Documentation\n\n${pageList}`,
                },
            ],
        };
    });
    server.resource('eduzz-openapi-spec', 'eduzz://openapi/spec.json', async () => {
        const spec = openApiProcessor.loadCachedSpec();
        if (!spec) {
            return {
                contents: [
                    {
                        uri: 'eduzz://openapi/spec.json',
                        mimeType: 'application/json',
                        text: JSON.stringify({ error: 'OpenAPI spec not available' }),
                    },
                ],
            };
        }
        return {
            contents: [
                {
                    uri: 'eduzz://openapi/spec.json',
                    mimeType: 'application/json',
                    text: JSON.stringify(spec.spec, null, 2),
                },
            ],
        };
    });
    return server;
}
export async function startServer(config = {}) {
    const server = createKnowledgeServer(config);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map