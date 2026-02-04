import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve o diretório de dados da knowledge base.
 *
 * Prioridade:
 * 1. Pasta 'data' no diretório do pacote mcp-knowledge (para uso em projeto)
 * 2. ~/.eduzz-mcp (fallback para uso standalone)
 */
export function getDataDir(): string {
  // Caminho relativo ao pacote: packages/mcp-knowledge/data
  // __dirname será dist/ após compilação, então subimos 1 nível
  const projectDataDir = join(__dirname, '..', 'data');

  if (existsSync(projectDataDir)) {
    return projectDataDir;
  }

  // Fallback para home do usuário
  return join(homedir(), '.eduzz-mcp');
}

/**
 * Retorna o caminho para o arquivo de configuração do usuário.
 * Sempre no home do usuário (credenciais não devem ir para o repo).
 */
export function getConfigDir(): string {
  return join(homedir(), '.eduzz-mcp');
}
