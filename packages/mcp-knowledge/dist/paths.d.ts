/**
 * Resolve o diretório de dados da knowledge base.
 *
 * Prioridade:
 * 1. Pasta 'data' no diretório do pacote mcp-knowledge (para uso em projeto local)
 * 2. Pasta 'packages/mcp-knowledge/data' relativa ao root (para bundle via npx)
 * 3. ~/.eduzz-mcp (fallback para uso standalone)
 */
export declare function getDataDir(): string;
/**
 * Retorna o caminho para o arquivo de configuração do usuário.
 * Sempre no home do usuário (credenciais não devem ir para o repo).
 */
export declare function getConfigDir(): string;
//# sourceMappingURL=paths.d.ts.map