# Eduzz MCP DevHub

Servidor MCP (Model Context Protocol) unificado para integração com a plataforma Eduzz.

Compatível com qualquer cliente MCP: Claude Code, Lovable, Kiro, Replit, Codex, etc.

## Instalação

### Configuração Manual (qualquer cliente MCP)

Adicione ao arquivo de configuração do seu cliente MCP (`.mcp.json`, `mcp.config.json`, etc):

```json
{
  "mcpServers": {
    "eduzz-devhub": {
      "command": "npx",
      "args": ["--yes", "github:eduardofurihata/labzz-mcp-devhub", "serve"]
    }
  }
}
```

### Setup automático (Claude Code)

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

Remova a entrada `eduzz-devhub` do seu arquivo de configuração MCP.

## Ferramentas Disponíveis

### Configuração
- `eduzz_profile_list` - Listar perfis
- `eduzz_profile_switch` - Trocar perfil ativo
- `eduzz_profile_create` - Criar novo perfil
- `eduzz_profile_delete` - Deletar perfil
- `eduzz_profile_active` - Info do perfil ativo

### Base de Conhecimento
- `eduzz_search` - Busca semântica na documentação
- `eduzz_get_example` - Exemplos de código por tópico
- `eduzz_get_endpoint` - Documentação de endpoints da API
- `eduzz_sync` - Sincronizar a base de conhecimento
- `eduzz_stats` - Estatísticas da base de conhecimento

### API
- `eduzz_api_call` - Chamada genérica à API
- `eduzz_api_endpoints` - Listar endpoints disponíveis
- `eduzz_api_status` - Status atual da API
- `eduzz_api_reload` - Recarregar ferramentas da OpenAPI spec
- Ferramentas dinâmicas geradas a partir da OpenAPI spec

### Resources
- `eduzz://docs/overview` - Visão geral da documentação
- `eduzz://openapi/spec.json` - OpenAPI spec completa

## CLI

```bash
labzz-mcp-devhub serve                  # Iniciar o servidor MCP
labzz-mcp-devhub setup [--global]       # Registrar no Claude Code
labzz-mcp-devhub sync                   # Sincronizar a knowledge base

labzz-mcp-devhub config create          # Wizard interativo de configuração
labzz-mcp-devhub config list            # Listar perfis
labzz-mcp-devhub config switch <name>   # Trocar perfil ativo
labzz-mcp-devhub config delete <name>   # Deletar perfil

labzz-mcp-devhub help                   # Ajuda
```

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
├── src/                  # Servidor unificado + CLI
├── packages/
│   ├── mcp-api/          # Cliente da API
│   ├── mcp-config/       # Gerenciamento de perfis
│   └── mcp-knowledge/    # Base de conhecimento
├── docs/                 # Documentação
├── cli.js                # Entrypoint (thin wrapper)
└── package.json
```

## Contribuindo

Veja o [guia de desenvolvimento](./docs/development.md) para instruções sobre como contribuir.

## License

MIT
