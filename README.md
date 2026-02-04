# Eduzz MCP Suite

Suite completa de integração MCP (Model Context Protocol) para a plataforma Eduzz.

## Instalação Rápida

Um único comando para instalar todos os servidores MCP no Claude Code:

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup
```

Para instalar em escopo global (disponível em todos os projetos):

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup --global
```

## Servidores Incluídos

| Servidor | Descrição |
|----------|-----------|
| `eduzz-config` | Gerenciamento de credenciais e perfis multi-tenant |
| `eduzz-knowledge` | Base de conhecimento com busca semântica |
| `eduzz-api` | Cliente da API Eduzz com ferramentas auto-geradas |

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
- Claude Code CLI instalado

## Exemplo de Uso

```bash
# 1. Instalar
npx --yes github:eduardofurihata/labzz-mcp-devhub setup

# 2. Reiniciar o Claude Code

# 3. Configurar credenciais (no Claude Code)
eduzz_profile_create(name: "sandbox", api_key: "...", api_secret: "...")

# 4. Usar as ferramentas
eduzz_search(query: "como criar um produto")
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
