# Eduzz MCP Suite - Documentação

Suite completa de integração MCP (Model Context Protocol) para a plataforma Eduzz.

## Índice

1. [Instalação](./installation.md) - Como instalar e configurar
2. [Configuração](./configuration.md) - Configuração de perfis e ambientes
3. [API Reference](./api-reference.md) - Referência completa das ferramentas
4. [Desenvolvimento](./development.md) - Guia para contribuidores

## Visão Geral

O Eduzz MCP Suite é composto por três servidores MCP que trabalham juntos:

| Servidor | Descrição |
|----------|-----------|
| `eduzz-config` | Gerenciamento de credenciais e perfis multi-tenant |
| `eduzz-knowledge` | Base de conhecimento com busca semântica |
| `eduzz-api` | Cliente da API Eduzz com ferramentas auto-geradas |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ eduzz-config │  │eduzz-knowledge│  │  eduzz-api   │       │
│  │              │  │              │  │              │       │
│  │ • Perfis     │  │ • Busca      │  │ • Chamadas   │       │
│  │ • Credenciais│  │ • Exemplos   │  │ • Endpoints  │       │
│  │ • Ambientes  │  │ • Docs       │  │ • Status     │       │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘       │
│         │                                    │               │
│         └────────────────┬───────────────────┘               │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  Eduzz API  │                            │
│                   └─────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Instalar todos os servidores de uma vez
npx --yes github:eduardofurihata/labzz-mcp-devhub setup

# Reiniciar o Claude Code e usar as ferramentas:
# - eduzz_profile_create para configurar credenciais
# - eduzz_search para buscar na documentação
# - eduzz_api_call para chamar a API
```

## Requisitos

- Node.js >= 18.0.0
- Claude Code CLI instalado

## Links Úteis

- [Documentação da API Eduzz](https://developers.eduzz.com)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Claude Code](https://claude.ai/code)
