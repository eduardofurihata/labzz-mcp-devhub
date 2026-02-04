#!/usr/bin/env node
import { startServer } from './server.js';
import { KnowledgeSyncer } from './sync.js';

const args = process.argv.slice(2);
const command = args[0];

async function sync(): Promise<void> {
  // API keys are optional - only used for AI image descriptions
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  const syncer = new KnowledgeSyncer();

  console.log('Starting knowledge base sync...');
  console.log('This will DELETE existing data and rebuild from scratch.\n');
  console.log('Using:');
  console.log('  - Local embeddings (no API key required)');
  console.log('  - Tesseract OCR for image text extraction (offline)\n');

  if (openaiApiKey || anthropicApiKey) {
    console.log('AI image descriptions: enabled (enhanced mode)\n');
  } else {
    console.log('AI image descriptions: disabled (using OCR only)\n');
  }

  const result = await syncer.sync({
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
  // API keys are optional
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const cronSchedule = process.env.EDUZZ_SYNC_SCHEDULE || undefined;

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
  eduzz-knowledge <command>

Commands:
  sync      Sync the knowledge base (deletes existing and rebuilds)
  serve     Start the MCP server
  help      Show this help message

Environment Variables (all optional):
  OPENAI_API_KEY         For AI-powered image descriptions
  ANTHROPIC_API_KEY      For AI-powered image descriptions
  EDUZZ_SYNC_SCHEDULE    Cron schedule for auto-sync (default: 0 3 * * 0)

Note: No API key is required for basic functionality!
      Embeddings are generated locally using Transformers.js.

Examples:
  eduzz-knowledge sync
  ANTHROPIC_API_KEY=sk-xxx eduzz-knowledge sync
  eduzz-knowledge serve
`);
}

async function main(): Promise<void> {
  switch (command) {
    case 'sync':
      await sync();
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
