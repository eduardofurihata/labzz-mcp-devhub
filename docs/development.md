# Desenvolvimento

Guia para contribuidores e desenvolvedores.

## Estrutura do Projeto

```
labzz-mcp-devhub/
├── .github/
│   └── workflows/
│       └── publish-npm.yml    # CI/CD
├── src/                       # Servidor unificado + CLI
│   ├── server.ts              # Cria McpServer e registra todas as tools
│   ├── cli.ts                 # CLI unificado
│   └── index.ts               # Re-exports
├── dist/                      # Build do src/ (commitado para npx compat)
├── docs/                      # Documentação
├── packages/
│   ├── mcp-api/               # Cliente da API
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── mcp-config/            # Gerenciamento de perfis
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── mcp-knowledge/         # Base de conhecimento
│       ├── src/
│       ├── data/              # Dados pré-processados
│       ├── tests/
│       └── package.json
├── cli.js                     # Entrypoint (thin wrapper -> dist/cli.js)
├── package.json               # Configuração do monorepo
├── tsconfig.json              # Configuração TypeScript base (packages estendem)
├── tsconfig.build.json        # Configuração TypeScript para src/ do root
└── vitest.config.ts           # Configuração de testes
```

## Setup Local

```bash
# Clonar o repositório
git clone https://github.com/eduardofurihata/labzz-mcp-devhub.git
cd labzz-mcp-devhub

# Instalar dependências
npm install

# Build de todos os pacotes + servidor unificado
npm run build

# Rodar testes
npx vitest run
```

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Build de todos os pacotes + servidor unificado |
| `npm run build:root` | Build apenas do servidor unificado (src/) |
| `npx vitest run` | Executa todos os testes |
| `npm run lint` | Verifica código TypeScript |
| `npm run clean` | Remove arquivos de build |
| `npm run sync` | Sincroniza base de conhecimento |

## Arquitetura

### Padrão de Registro de Tools

Cada pacote exporta uma função `registerXTools(server, deps)` que registra suas ferramentas em qualquer instância de `McpServer`:

```typescript
// packages/mcp-config/src/server.ts
export function registerConfigTools(server: McpServer, configManager: ConfigManager): void {
  server.tool('eduzz_profile_list', ...);
  server.tool('eduzz_profile_create', ...);
  // ...
}
```

O servidor unificado (`src/server.ts`) cria UM `McpServer` e chama os 3 registradores:

```typescript
// src/server.ts
export function createServer(): McpServer {
  const server = new McpServer({ name: 'eduzz-devhub', version: '2.0.0' });
  registerConfigTools(server, configManager);
  registerKnowledgeTools(server, knowledgeConfig);
  registerAPITools(server, { configManager });
  return server;
}
```

### Backward Compatibility

Cada pacote mantém `createXServer()` e `startServer()` para uso standalone. Estes são wrappers que criam seu próprio `McpServer` e chamam a função de registro.

## Desenvolvimento de um Pacote

Cada pacote em `packages/` segue a mesma estrutura:

```
packages/mcp-{nome}/
├── src/
│   ├── index.ts      # Exports públicos
│   ├── server.ts     # registerXTools() + createXServer() + startServer()
│   ├── cli.ts        # CLI standalone do pacote
│   └── types.ts      # Tipos TypeScript
├── tests/
│   └── *.test.ts     # Testes com Vitest
├── package.json
├── tsconfig.json
└── README.md
```

### Adicionando Novas Tools

1. Implemente a função `registerXTools()` no `server.ts` do pacote
2. Exporte via `index.ts`
3. Importe e chame no `src/server.ts` do root

## Testes

Usamos [Vitest](https://vitest.dev/) para testes.

```typescript
// packages/mcp-config/tests/config-manager.test.ts
import { describe, it, expect } from 'vitest';
import { ConfigManager } from '../src/config-manager.js';

describe('ConfigManager', () => {
  it('should create a profile', () => {
    const manager = new ConfigManager();
    manager.createProfile('test', 'key', 'secret', 'sandbox');

    const profiles = manager.listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('test');
  });
});
```

Executar testes:

```bash
# Todos os testes (do root)
npx vitest run

# Watch mode
npx vitest
```

## CI/CD

O projeto usa GitHub Actions para CI/CD:

- **Trigger:** Push em `main` com mudanças em `packages/`, `src/`, `package.json`, `cli.js` ou `tsconfig.build.json`
- **Steps:**
  1. Checkout
  2. Setup Node.js 20
  3. Install dependencies
  4. Build (workspaces + root)
  5. Run tests
  6. Publish (se versão mudou)

### Publicando Nova Versão

1. Atualize a versão no `package.json` raiz
2. Rebuild: `npm run build`
3. Commit o `dist/` atualizado junto com as mudanças
4. Push para `main`
5. O workflow publica automaticamente se a versão mudou

## Convenções

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova ferramenta de busca
fix: corrige erro de autenticação
docs: atualiza documentação da API
chore: atualiza dependências
```

### Código

- TypeScript strict mode
- ESM modules (`"type": "module"`)
- Nomes de ferramentas: `eduzz_nome_da_ferramenta`
- Testes para toda lógica de negócio

## Debugging

Para debugar o servidor unificado localmente:

```bash
# Build tudo
npm run build

# Executar o servidor unificado
node dist/cli.js serve
```

Para debugar um pacote standalone:

```bash
# Build o pacote
npm run build -w @eduzz/mcp-config

# Executar diretamente
node packages/mcp-config/dist/cli.js serve
```

O servidor vai esperar input via stdin e responder via stdout (protocolo MCP).

## Recursos

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Eduzz API Docs](https://developers.eduzz.com)
