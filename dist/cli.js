#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { startServer } from './server.js';
import { ConfigManager, EnvironmentSchema } from '@eduzz/mcp-config';
import { KnowledgeSyncer } from '@eduzz/mcp-knowledge';
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
const REPO = 'github:eduardofurihata/labzz-mcp-devhub';
function prompt(question) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
// --- serve ---
async function serve() {
    await startServer();
}
// --- setup ---
function setup(global = false) {
    const scopeLabel = global ? ' (escopo global)' : ' (escopo do projeto)';
    console.log(`\nInstalando Eduzz DevHub${scopeLabel}...\n`);
    try {
        const claudeArgs = ['mcp', 'add', 'eduzz-devhub'];
        if (global) {
            claudeArgs.push('-s', 'user');
        }
        claudeArgs.push('--', 'npx', '--yes', REPO, 'serve');
        execFileSync('claude', claudeArgs, { stdio: 'inherit' });
        console.log('\neduzz-devhub adicionado com sucesso!\n');
    }
    catch (error) {
        console.error(`Erro ao adicionar eduzz-devhub: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
    console.log('Setup completo! Reinicie o Claude Code para usar o servidor.\n');
}
// --- sync ---
async function sync() {
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
    }
    else {
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
// --- config ---
async function configSetup() {
    console.log('\n=== Eduzz MCP Configuration Setup ===\n');
    const configManager = new ConfigManager();
    const name = await prompt('Profile name (e.g., sandbox, production): ');
    if (!name) {
        console.error('Profile name is required');
        process.exit(1);
    }
    const apiKey = await prompt('API Key: ');
    if (!apiKey) {
        console.error('API Key is required');
        process.exit(1);
    }
    const apiSecret = await prompt('API Secret: ');
    if (!apiSecret) {
        console.error('API Secret is required');
        process.exit(1);
    }
    let environment = 'sandbox';
    const envInput = await prompt('Environment (sandbox/production) [sandbox]: ');
    if (envInput) {
        const parsed = EnvironmentSchema.safeParse(envInput);
        if (parsed.success) {
            environment = parsed.data;
        }
        else {
            console.log('Invalid environment, using sandbox');
        }
    }
    try {
        configManager.createProfile(name, apiKey, apiSecret, environment);
        console.log(`\nProfile "${name}" created successfully!`);
        console.log(`Config stored at: ${configManager.getConfigDir()}`);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
function configList() {
    const configManager = new ConfigManager();
    const profiles = configManager.listProfiles();
    if (profiles.length === 0) {
        console.log('No profiles configured. Run: labzz-mcp-devhub config create');
        return;
    }
    console.log('\nConfigured profiles:');
    for (const profile of profiles) {
        const activeMarker = profile.isActive ? ' (active)' : '';
        console.log(`  - ${profile.name}${activeMarker}: ${profile.environment}`);
    }
    console.log();
}
function configSwitch(name) {
    const configManager = new ConfigManager();
    try {
        configManager.switchProfile(name);
        console.log(`Switched to profile "${name}"`);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
function configDelete(name) {
    const configManager = new ConfigManager();
    try {
        configManager.deleteProfile(name);
        console.log(`Profile "${name}" deleted`);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
// --- help ---
function showHelp() {
    console.log(`
Eduzz DevHub - Unified MCP Server for the Eduzz platform

Usage:
  labzz-mcp-devhub <command> [options]

Commands:
  serve                  Start the unified MCP server
  setup [--global]       Register the server in Claude Code
  sync                   Sync the knowledge base (crawl + rebuild)

  config create          Interactive setup wizard for a new profile
  config list            List all configured profiles
  config switch <name>   Switch to a different profile
  config delete <name>   Delete a profile

  help                   Show this help message

Environment Variables (all optional):
  OPENAI_API_KEY         For AI-powered image descriptions during sync
  ANTHROPIC_API_KEY      For AI-powered image descriptions during sync
  EDUZZ_SYNC_SCHEDULE    Cron schedule for auto-sync (default: 0 3 * * 0)

Examples:
  labzz-mcp-devhub serve
  labzz-mcp-devhub setup
  labzz-mcp-devhub sync
  labzz-mcp-devhub config create
  labzz-mcp-devhub config list
`);
}
async function main() {
    switch (command) {
        case 'serve':
            await serve();
            break;
        case 'setup':
            setup(args.includes('--global') || args.includes('-g'));
            break;
        case 'sync':
            await sync();
            break;
        case 'config':
            switch (subCommand) {
                case 'create':
                    await configSetup();
                    break;
                case 'list':
                    configList();
                    break;
                case 'switch':
                    if (!args[2]) {
                        console.error('Profile name required. Usage: labzz-mcp-devhub config switch <name>');
                        process.exit(1);
                    }
                    configSwitch(args[2]);
                    break;
                case 'delete':
                    if (!args[2]) {
                        console.error('Profile name required. Usage: labzz-mcp-devhub config delete <name>');
                        process.exit(1);
                    }
                    configDelete(args[2]);
                    break;
                default:
                    if (subCommand) {
                        console.error(`Unknown config command: ${subCommand}`);
                    }
                    showHelp();
                    break;
            }
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