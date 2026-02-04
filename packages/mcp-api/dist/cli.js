#!/usr/bin/env node
import { startServer } from './server.js';
const args = process.argv.slice(2);
const command = args[0];
async function serve() {
    await startServer();
}
function showHelp() {
    console.log(`
Eduzz MCP API CLI

Usage:
  eduzz-api <command>

Commands:
  serve    Start the MCP server
  help     Show this help message

Prerequisites:
  - Configure credentials using: eduzz-config setup
  - Sync knowledge base for OpenAPI tools: eduzz-knowledge sync

Examples:
  eduzz-api serve
`);
}
async function main() {
    switch (command) {
        case 'serve':
            await serve();
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            if (command) {
                console.error(`Unknown command: ${command}`);
            }
            showHelp();
            break;
    }
}
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map