import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { ConfigManager } from '@eduzz/mcp-config';
import { EduzzAPIClient } from './client.js';
import { ToolGenerator } from './generator.js';
import { APIClientConfig } from './types.js';

export interface APIServerConfig {
  configManager?: ConfigManager;
}

export function registerAPITools(server: McpServer, config: APIServerConfig = {}): void {
  const configManager = config.configManager || new ConfigManager();
  let currentClient: EduzzAPIClient | null = null;
  let generatedTools: Map<string, ReturnType<ToolGenerator['generateTools']>[number]> = new Map();

  function getClient(): EduzzAPIClient {
    const activeProfile = configManager.getActiveProfile();
    if (!activeProfile) {
      throw new Error('No active profile. Use eduzz_profile_create to configure credentials.');
    }

    const clientConfig: APIClientConfig = {
      apiKey: activeProfile.profile.api_key,
      apiSecret: activeProfile.profile.api_secret,
      environment: activeProfile.profile.environment,
    };

    // Reuse client if config hasn't changed
    if (currentClient) {
      return currentClient;
    }

    currentClient = new EduzzAPIClient(clientConfig);
    return currentClient;
  }

  function loadOpenAPISpec(): Record<string, unknown> | null {
    const specPath = join(homedir(), '.eduzz-mcp', 'raw', 'openapi', 'spec.json');

    if (!existsSync(specPath)) {
      return null;
    }

    try {
      const content = readFileSync(specPath, 'utf-8');
      const parsed = JSON.parse(content) as { spec?: Record<string, unknown> };
      return parsed.spec || null;
    } catch {
      return null;
    }
  }

  function initializeGeneratedTools(): void {
    const spec = loadOpenAPISpec();
    if (!spec) {
      return;
    }

    try {
      const client = getClient();
      const generator = new ToolGenerator(spec, client);
      generatedTools = generator.generateToolsMap();
    } catch {
      // Config might not be set up yet
    }
  }

  // Initialize on startup
  initializeGeneratedTools();

  // Generic API call tool (always available)
  server.tool(
    'eduzz_api_call',
    'Make a generic API call to the Eduzz API',
    {
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
      path: z.string().describe('API endpoint path (e.g., "/invoices", "/users/123")'),
      query: z.record(z.string()).optional().describe('Query parameters'),
      body: z.unknown().optional().describe('Request body for POST/PUT/PATCH'),
      profile: z.string().optional().describe('Profile name to use (defaults to active profile)'),
    },
    async ({ method, path, query, body, profile }) => {
      try {
        // Switch profile if specified
        if (profile) {
          configManager.switchProfile(profile);
          currentClient = null; // Force new client
        }

        const client = getClient();
        const response = await client.request({
          method,
          path,
          query: query as Record<string, string | number | boolean> | undefined,
          body,
        });

        if (!response.success) {
          return {
            content: [
              {
                type: 'text',
                text: `API Error: ${response.error?.code} - ${response.error?.message}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
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
    }
  );

  // List available API endpoints
  server.tool(
    'eduzz_api_endpoints',
    'List available API endpoints from the OpenAPI spec',
    {
      filter: z.string().optional().describe('Filter endpoints by path or method'),
    },
    async ({ filter }) => {
      const spec = loadOpenAPISpec() as { paths?: Record<string, Record<string, { summary?: string }>> } | null;

      if (!spec || !spec.paths) {
        return {
          content: [
            {
              type: 'text',
              text: 'No OpenAPI spec available. Run eduzz_sync from mcp-knowledge to fetch the API documentation.',
            },
          ],
        };
      }

      const endpoints: string[] = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            continue;
          }

          const op = operation as { summary?: string };
          const line = `${method.toUpperCase().padEnd(7)} ${path} - ${op.summary || 'No description'}`;

          if (!filter || line.toLowerCase().includes(filter.toLowerCase())) {
            endpoints.push(line);
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: endpoints.length > 0
              ? `Available API endpoints:\n\n${endpoints.join('\n')}`
              : 'No endpoints found matching the filter.',
          },
        ],
      };
    }
  );

  // Get current profile info
  server.tool(
    'eduzz_api_status',
    'Get the current API configuration status',
    {},
    async () => {
      const activeProfile = configManager.getActiveProfile();

      if (!activeProfile) {
        return {
          content: [
            {
              type: 'text',
              text: 'No active profile configured. Use eduzz_profile_create to set up credentials.',
            },
          ],
        };
      }

      const client = getClient();
      const rateLimit = client.getRateLimitInfo();

      let status = `API Status:
- Active Profile: ${activeProfile.name}
- Environment: ${activeProfile.profile.environment}
- API Key: ${activeProfile.profile.api_key.substring(0, 8)}...`;

      if (rateLimit) {
        status += `
- Rate Limit: ${rateLimit.remaining}/${rateLimit.limit}
- Resets at: ${rateLimit.resetAt.toISOString()}`;
      }

      const spec = loadOpenAPISpec();
      if (spec) {
        status += '\n- OpenAPI spec: Loaded';
        status += `\n- Generated tools: ${generatedTools.size}`;
      } else {
        status += '\n- OpenAPI spec: Not available';
      }

      return {
        content: [
          {
            type: 'text',
            text: status,
          },
        ],
      };
    }
  );

  // Reload generated tools
  server.tool(
    'eduzz_api_reload',
    'Reload the API tools from the OpenAPI spec',
    {},
    async () => {
      currentClient = null;
      initializeGeneratedTools();

      return {
        content: [
          {
            type: 'text',
            text: `Reloaded ${generatedTools.size} API tools from OpenAPI spec.`,
          },
        ],
      };
    }
  );

  // Register generated tools dynamically
  // Note: In a real implementation, you'd need to restart the server
  // or use a dynamic tool registration mechanism
  for (const [name, tool] of generatedTools) {
    server.tool(
      name,
      tool.description,
      tool.inputSchema instanceof z.ZodObject
        ? (tool.inputSchema as z.ZodObject<Record<string, z.ZodType>>).shape
        : {},
      async (params) => {
        try {
          const result = await tool.handler(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
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
      }
    );
  }

}

export function createAPIServer(config: APIServerConfig = {}): McpServer {
  const server = new McpServer({
    name: 'eduzz-api',
    version: '1.0.0',
  });
  registerAPITools(server, config);
  return server;
}

export async function startServer(config: APIServerConfig = {}): Promise<void> {
  const server = createAPIServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
