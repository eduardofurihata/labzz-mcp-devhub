#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

const REPO = 'github:eduardofurihata/labzz-mcp-devhub';
const SERVERS = {
  'eduzz-config': join(__dirname, 'packages/mcp-config/dist/cli.js'),
  'eduzz-knowledge': join(__dirname, 'packages/mcp-knowledge/dist/cli.js'),
  'eduzz-api': join(__dirname, 'packages/mcp-api/dist/cli.js'),
};

function showHelp() {
  console.log(`
Eduzz MCP Suite - Ferramentas MCP para integração com a plataforma Eduzz

Uso:
  npx github:eduardofurihata/labzz-mcp-devhub <comando>

Comandos:
  eduzz-config <args>     Servidor MCP de configuração
  eduzz-knowledge <args>  Servidor MCP de base de conhecimento
  eduzz-api <args>        Servidor MCP da API

  setup                   Instala todos os servidores no Claude Code
  setup --global          Instala em escopo global
  help                    Mostra esta mensagem

Exemplo (iniciar servidor):
  npx github:eduardofurihata/labzz-mcp-devhub eduzz-config serve

Exemplo (setup Claude Code):
  npx github:eduardofurihata/labzz-mcp-devhub setup
`);
}

function runServer(serverName, serverArgs) {
  const serverPath = SERVERS[serverName];
  if (!serverPath) {
    console.error(`Servidor desconhecido: ${serverName}`);
    process.exit(1);
  }

  // Spawn the server process, inheriting stdio for MCP communication
  const child = spawn('node', [serverPath, ...serverArgs], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`Erro ao iniciar servidor: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function setup(global = false) {
  const scopeLabel = global ? ' (escopo global)' : ' (escopo do projeto)';

  console.log(`\n🚀 Instalando Eduzz MCP Suite${scopeLabel}...\n`);

  for (const name of Object.keys(SERVERS)) {
    try {
      console.log(`  ➜ Adicionando ${name}...`);
      const claudeArgs = ['mcp', 'add', name];
      if (global) {
        claudeArgs.push('-s', 'user');
      }
      claudeArgs.push('--', 'npx', '--yes', REPO, name, 'serve');
      execFileSync('claude', claudeArgs, { stdio: 'inherit' });
      console.log(`  ✓ ${name} adicionado com sucesso\n`);
    } catch (error) {
      console.error(`  ✗ Erro ao adicionar ${name}: ${error.message}\n`);
    }
  }

  console.log('✅ Setup completo! Reinicie o Claude Code para usar os servidores.\n');
}

function main() {
  // Check if command is a server name
  if (SERVERS[command]) {
    runServer(command, args.slice(1));
    return;
  }

  switch (command) {
    case 'setup':
      const isGlobal = args.includes('--global') || args.includes('-g');
      setup(isGlobal);
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    default:
      console.error(`Comando desconhecido: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main();
