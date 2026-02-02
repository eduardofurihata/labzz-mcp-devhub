#!/usr/bin/env node
import { startServer } from './server.js';

const args = process.argv.slice(2);
const command = args[0];

async function serve(): Promise<void> {
  await startServer();
}

function showHelp(): void {
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

async function main(): Promise<void> {
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
