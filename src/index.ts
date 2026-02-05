export { createServer, startServer } from './server.js';

// Re-export package APIs for library usage
export { ConfigManager, registerConfigTools } from '@eduzz/mcp-config';
export { registerKnowledgeTools, setupKnowledgeCron, type KnowledgeServerConfig } from '@eduzz/mcp-knowledge';
export { registerAPITools, type APIServerConfig } from '@eduzz/mcp-api';
