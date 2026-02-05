import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConfigManager } from '@eduzz/mcp-config';
export interface APIServerConfig {
    configManager?: ConfigManager;
}
export declare function registerAPITools(server: McpServer, config?: APIServerConfig): void;
export declare function createAPIServer(config?: APIServerConfig): McpServer;
export declare function startServer(config?: APIServerConfig): Promise<void>;
//# sourceMappingURL=server.d.ts.map