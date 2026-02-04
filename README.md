# Eduzz MCP Suite

Suite completa de servidores MCP (Model Context Protocol) para integração com a plataforma Eduzz.

Compatível com qualquer cliente MCP: Claude Code, Lovable, Kiro, Replit, Codex, etc.

## Servidores Disponíveis

| Servidor | Descrição |
|----------|-----------|
| `eduzz-config` | Gerenciamento de credenciais e perfis multi-tenant |
| `eduzz-knowledge` | Base de conhecimento com busca semântica |
| `eduzz-api` | Cliente da API Eduzz com ferramentas auto-geradas |

## Instalação

### Configuração Manual (qualquer cliente MCP)

Adicione ao arquivo de configuração do seu cliente MCP (`.mcp.json`, `mcp.config.json`, etc):

```json
{
  "mcpServers": {
    "eduzz-config": {
      "command": "npx",
      "args": ["--yes", "github:eduardofurihata/labzz-mcp-devhub", "eduzz-config", "serve"]
    },
    "eduzz-knowledge": {
      "command": "npx",
      "args": ["--yes", "github:eduardofurihata/labzz-mcp-devhub", "eduzz-knowledge", "serve"]
    },
    "eduzz-api": {
      "command": "npx",
      "args": ["--yes", "github:eduardofurihata/labzz-mcp-devhub", "eduzz-api", "serve"]
    }
  }
}
```

### Executando um servidor diretamente

```bash
npx github:eduardofurihata/labzz-mcp-devhub eduzz-config serve
```

### Setup automático (Claude Code)

Se você usa Claude Code, pode instalar todos os servidores com um comando:

```bash
npx github:eduardofurihata/labzz-mcp-devhub setup
```

## Atualização

```bash
# 1. Limpar cache do npx
rm -rf ~/.npm/_npx

# 2. Reiniciar seu cliente MCP
```

## Desinstalação

Remova as entradas do seu arquivo de configuração MCP.

## Ferramentas Disponíveis

### Configuração (`eduzz-config`)
- `eduzz_profile_list` - Listar perfis
- `eduzz_profile_switch` - Trocar perfil ativo
- `eduzz_profile_create` - Criar novo perfil
- `eduzz_profile_delete` - Deletar perfil
- `eduzz_profile_active` - Info do perfil ativo

### Base de Conhecimento (`eduzz-knowledge`)
- `eduzz_search` - Busca semântica na documentação
- `eduzz_get_example` - Exemplos de código por tópico
- `eduzz_get_endpoint` - Documentação de endpoints da API

### API (`eduzz-api`)
- `eduzz_api_call` - Chamada genérica à API
- `eduzz_api_endpoints` - Listar endpoints disponíveis
- `eduzz_api_status` - Status atual da API

## Documentação

- [Instalação](./docs/installation.md) - Guia completo de instalação
- [Configuração](./docs/configuration.md) - Configuração de perfis e ambientes
- [API Reference](./docs/api-reference.md) - Referência completa das ferramentas
- [Desenvolvimento](./docs/development.md) - Guia para contribuidores

## Requisitos

- Node.js >= 18.0.0

## Exemplo de Uso

```bash
# 1. Configurar credenciais (via ferramenta MCP)
eduzz_profile_create(name: "sandbox", api_key: "...", api_secret: "...")

# 2. Buscar na documentação
eduzz_search(query: "como criar um produto")

# 3. Chamar a API
eduzz_api_call(endpoint: "/products", method: "GET")
```

## Estrutura do Projeto

```
labzz-mcp-devhub/
├── packages/
│   ├── mcp-api/          # Cliente da API
│   ├── mcp-config/       # Gerenciamento de perfis
│   └── mcp-knowledge/    # Base de conhecimento
├── docs/                 # Documentação
├── cli.js                # CLI principal
└── package.json
```

## Contribuindo

Veja o [guia de desenvolvimento](./docs/development.md) para instruções sobre como contribuir.

## License

MIT
