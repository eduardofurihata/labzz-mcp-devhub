import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export interface KnowledgeServerConfig {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    cronSchedule?: string;
}
export declare function registerKnowledgeTools(server: McpServer, config?: KnowledgeServerConfig): void;
export declare function setupKnowledgeCron(config?: KnowledgeServerConfig): void;
export declare function createKnowledgeServer(config?: KnowledgeServerConfig): McpServer;
export declare function startServer(config?: KnowledgeServerConfig): Promise<void>;
//# sourceMappingURL=server.d.ts.map