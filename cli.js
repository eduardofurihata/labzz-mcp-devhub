#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const command = args[0];

const REPO = 'github:eduardofurihata/labzz-mcp-devhub';
const SERVERS = ['eduzz-config', 'eduzz-knowledge', 'eduzz-api'];

function showHelp() {
  console.log(`
Eduzz MCP Suite - Ferramentas MCP para integração com a plataforma Eduzz

Uso:
  npx github:eduardofurihata/labzz-mcp-devhub <comando>

Comandos:
  setup             Adiciona todos os servidores MCP ao Claude Code
  setup --global    Adiciona em escopo global (disponível em todos os projetos)
  help              Mostra esta mensagem

Servidores incluídos:
  - eduzz-config     Gerenciamento de credenciais e perfis
  - eduzz-knowledge  Base de conhecimento com busca semântica
  - eduzz-api        Cliente da API Eduzz

Exemplo:
  npx github:eduardofurihata/labzz-mcp-devhub setup
`);
}

function setup(global = false) {
  const scopeLabel = global ? ' (escopo global)' : ' (escopo do projeto)';

  console.log(`\n🚀 Instalando Eduzz MCP Suite${scopeLabel}...\n`);

  for (const name of SERVERS) {
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
