import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigManager, registerConfigTools } from '@eduzz/mcp-config';
import { registerKnowledgeTools, setupKnowledgeCron } from '@eduzz/mcp-knowledge';
import { registerAPITools } from '@eduzz/mcp-api';
export function createServer() {
    const server = new McpServer({
        name: 'eduzz-devhub',
        version: '2.0.0',
    });
    const configManager = new ConfigManager();
    // Register all tools on a single server
    registerConfigTools(server, configManager);
    const knowledgeConfig = {};
    registerKnowledgeTools(server, knowledgeConfig);
    registerAPITools(server, { configManager });
    // Start background cron for knowledge sync
    setupKnowledgeCron(knowledgeConfig);
    return server;
}
export async function startServer() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map