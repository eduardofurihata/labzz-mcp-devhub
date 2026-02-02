# Eduzz MCP Suite

Suite completa de integração MCP (Model Context Protocol) para a plataforma Eduzz:

- **@eduzz/mcp-config** - Gerenciamento de credenciais e perfis
- **@eduzz/mcp-knowledge** - Base de conhecimento com busca semântica
- **@eduzz/mcp-api** - Cliente da API com ferramentas auto-geradas

## Quick Start

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/labzz-mcp-devhub.git
cd labzz-mcp-devhub/eduzz-mcp
npm install
npm run build
```

### 2. Configurar no Claude Code

Copie o arquivo `.mcp.json` para a raiz do seu projeto:

```json
{
  "mcpServers": {
    "eduzz-config": {
      "command": "node",
      "args": ["./eduzz-mcp/packages/mcp-config/dist/cli.js", "serve"]
    },
    "eduzz-knowledge": {
      "command": "node",
      "args": ["./eduzz-mcp/packages/mcp-knowledge/dist/cli.js", "serve"]
    },
    "eduzz-api": {
      "command": "node",
      "args": ["./eduzz-mcp/packages/mcp-api/dist/cli.js", "serve"]
    }
  }
}
```

### 3. Pronto!

A base de conhecimento já vem **pré-populada** com toda a documentação da Eduzz. Não precisa rodar sync!

**Ferramentas disponíveis:**
- `eduzz_search` - Busca semântica na documentação
- `eduzz_get_example` - Exemplos de código por tópico
- `eduzz_get_endpoint` - Documentação de endpoints da API
- `eduzz_profile_*` - Gerenciamento de credenciais

## Packages

### @eduzz/mcp-config

Gerencia credenciais da API com suporte multi-tenant.

**Tools:**
- `eduzz_profile_list` - Listar perfis
- `eduzz_profile_switch` - Trocar perfil ativo
- `eduzz_profile_create` - Criar novo perfil
- `eduzz_profile_delete` - Deletar perfil
- `eduzz_profile_active` - Info do perfil ativo

### @eduzz/mcp-knowledge

Base de conhecimento com busca semântica usando embeddings locais (Transformers.js).

**Tools:**
- `eduzz_search` - Busca semântica na documentação
- `eduzz_get_example` - Exemplos de código por tópico/linguagem
- `eduzz_get_endpoint` - Documentação de endpoint da API
- `eduzz_sync` - Sincronizar base de conhecimento
- `eduzz_stats` - Estatísticas da base

**Recursos:**
- `eduzz://docs/overview` - Visão geral da documentação
- `eduzz://openapi/spec.json` - Especificação OpenAPI

### @eduzz/mcp-api

Cliente da API com ferramentas auto-geradas do OpenAPI spec.

**Tools:**
- `eduzz_api_call` - Chamada genérica à API
- `eduzz_api_endpoints` - Listar endpoints disponíveis
- `eduzz_api_status` - Status atual da API
- `eduzz_api_reload` - Recarregar ferramentas geradas

## Estrutura de Dados

```
packages/mcp-knowledge/data/
├── processed/
│   └── knowledge.db.json     # Embeddings vetoriais
└── raw/
    ├── pages/                # Documentação (markdown)
    ├── images/               # Imagens + descrições
    ├── code-examples/        # Exemplos de código
    └── openapi/              # Especificações da API
```

## Para Desenvolvedores

### Atualizar a Base de Conhecimento

```bash
# Sync completo (apaga e recria tudo)
npm run sync

# Ou via CLI
node packages/mcp-knowledge/dist/cli.js sync
```

### Build

```bash
npm run build        # Build todos os pacotes
npm test             # Rodar testes
```

## Uso Multi-Tenant

Crie perfis para diferentes ambientes:

```bash
# Via ferramenta MCP
eduzz_profile_create(name: "sandbox", api_key: "...", api_secret: "...", environment: "sandbox")
eduzz_profile_create(name: "production", api_key: "...", api_secret: "...", environment: "production")

# Trocar entre perfis
eduzz_profile_switch(name: "production")
```

## Requisitos

- Node.js >= 18.0.0
- Claude Code ou Claude Desktop

## License

MIT
