#!/usr/bin/env node
import { startServer } from './server.js';
import { KnowledgeSyncer } from './sync.js';

const args = process.argv.slice(2);
const command = args[0];

function getEnvVar(name: string, required: boolean = false): string {
  const value = process.env[name];
  if (required && !value) {
    console.error(`Error: ${name} environment variable is required`);
    process.exit(1);
  }
  return value || '';
}

async function sync(force: boolean = false): Promise<void> {
  const openaiApiKey = getEnvVar('OPENAI_API_KEY', true);
  const anthropicApiKey = getEnvVar('ANTHROPIC_API_KEY');

  const syncer = new KnowledgeSyncer();

  console.log('Starting knowledge base sync...\n');

  const result = await syncer.sync({
    force,
    openaiApiKey,
    anthropicApiKey,
    onProgress: (msg) => console.log(msg),
  });

  console.log('\n=== Sync Summary ===');
  console.log(`Pages processed: ${result.pagesProcessed}`);
  console.log(`Images processed: ${result.imagesProcessed}`);
  console.log(`Code examples: ${result.codeExamplesProcessed}`);
  console.log(`Chunks indexed: ${result.chunksIndexed}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log(`\nStorage location: ${syncer.getStoragePath()}`);
}

async function serve(): Promise<void> {
  const openaiApiKey = getEnvVar('OPENAI_API_KEY', true);
  const anthropicApiKey = getEnvVar('ANTHROPIC_API_KEY');
  const cronSchedule = getEnvVar('EDUZZ_SYNC_SCHEDULE') || undefined;

  await startServer({
    openaiApiKey,
    anthropicApiKey,
    cronSchedule,
  });
}

function showHelp(): void {
  console.log(`
Eduzz MCP Knowledge CLI

Usage:
  eduzz-knowledge <command> [options]

Commands:
  sync [--force]    Sync the knowledge base from Eduzz documentation
  serve             Start the MCP server
  help              Show this help message

Environment Variables:
  OPENAI_API_KEY         Required for embeddings and image descriptions
  ANTHROPIC_API_KEY      Optional, for using Claude for image descriptions
  EDUZZ_SYNC_SCHEDULE    Optional cron schedule for auto-sync (default: 0 3 * * 0)

Examples:
  OPENAI_API_KEY=sk-... eduzz-knowledge sync
  OPENAI_API_KEY=sk-... eduzz-knowledge sync --force
  OPENAI_API_KEY=sk-... eduzz-knowledge serve
`);
}

async function main(): Promise<void> {
  switch (command) {
    case 'sync':
      const force = args.includes('--force') || args.includes('-f');
      await sync(force);
      break;
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
