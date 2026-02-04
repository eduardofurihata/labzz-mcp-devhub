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

Após a instalação, você terá acesso às seguintes ferramentas no Claude Code:

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

## Requisitos

- Node.js >= 18.0.0
- Claude Code CLI instalado

## Documentação Completa

Veja a [documentação detalhada](./eduzz-mcp/README.md) para mais informações sobre configuração e uso avançado.

## License

MIT
