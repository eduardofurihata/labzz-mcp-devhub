# Desenvolvimento

Guia para contribuidores e desenvolvedores.

## Estrutura do Projeto

```
labzz-mcp-devhub/
├── .github/
│   └── workflows/
│       └── publish-npm.yml    # CI/CD
├── docs/                      # Documentação
├── packages/
│   ├── mcp-api/              # Cliente da API
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   ├── mcp-config/           # Gerenciamento de perfis
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── mcp-knowledge/        # Base de conhecimento
│       ├── src/
│       ├── data/             # Dados pré-processados
│       ├── tests/
│       └── package.json
├── cli.js                    # CLI principal
├── package.json              # Configuração do monorepo
├── tsconfig.json             # Configuração TypeScript
└── vitest.config.ts          # Configuração de testes
```

## Setup Local

```bash
# Clonar o repositório
git clone https://github.com/eduardofurihata/labzz-mcp-devhub.git
cd labzz-mcp-devhub

# Instalar dependências
npm install

# Build de todos os pacotes
npm run build

# Rodar testes
npm test
```

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Build de todos os pacotes |
| `npm test` | Executa todos os testes |
| `npm run lint` | Verifica código TypeScript |
| `npm run clean` | Remove arquivos de build |
| `npm run sync` | Sincroniza base de conhecimento |

## Desenvolvimento de um Pacote

Cada pacote em `packages/` é independente e segue a mesma estrutura:

```
packages/mcp-{nome}/
├── src/
│   ├── index.ts      # Exports públicos
│   ├── server.ts     # Servidor MCP
│   ├── cli.ts        # CLI do pacote
│   └── types.ts      # Tipos TypeScript
├── tests/
│   └── *.test.ts     # Testes com Vitest
├── package.json
├── tsconfig.json
└── README.md
```

### Criando um Novo Servidor MCP

1. **Crie a estrutura:**
```bash
mkdir -p packages/mcp-novo/src
mkdir -p packages/mcp-novo/tests
```

2. **Adicione o package.json:**
```json
{
  "name": "@eduzz/mcp-novo",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "eduzz-novo": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

3. **Implemente o servidor:**
```typescript
// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'eduzz-novo',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Registrar ferramentas
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'minha_ferramenta',
      description: 'Descrição da ferramenta',
      inputSchema: {
        type: 'object',
        properties: {
          param: { type: 'string' }
        }
      }
    }
  ]
}));

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

4. **Adicione ao CLI principal:**
```javascript
// cli.js - adicione ao SERVERS
const SERVERS = {
  // ...existentes
  'eduzz-novo': join(__dirname, 'packages/mcp-novo/dist/cli.js'),
};
```

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
# Todos os testes
npm test

# Testes de um pacote específico
npm test -w @eduzz/mcp-config

# Watch mode
npx vitest
```

## CI/CD

O projeto usa GitHub Actions para CI/CD:

- **Trigger:** Push em `main` com mudanças em `packages/`, `package.json`, ou `cli.js`
- **Steps:**
  1. Checkout
  2. Setup Node.js 20
  3. Install dependencies
  4. Build
  5. Run tests
  6. Publish (se versão mudou)

### Publicando Nova Versão

1. Atualize a versão no `package.json` raiz
2. Commit e push para `main`
3. O workflow publica automaticamente se a versão mudou

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

Para debugar um servidor MCP localmente:

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
