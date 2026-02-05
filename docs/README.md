# Eduzz MCP DevHub - Documentação

Servidor MCP (Model Context Protocol) unificado para integração com a plataforma Eduzz.

## Índice

1. [Instalação](./installation.md) - Como instalar e configurar
2. [Configuração](./configuration.md) - Configuração de perfis e ambientes
3. [API Reference](./api-reference.md) - Referência completa das ferramentas
4. [Desenvolvimento](./development.md) - Guia para contribuidores

## Visão Geral

O Eduzz MCP DevHub é um servidor MCP unificado que expõe todas as ferramentas em um único processo:

| Módulo | Ferramentas |
|--------|-------------|
| Configuração | Gerenciamento de credenciais e perfis multi-tenant |
| Knowledge | Base de conhecimento com busca semântica |
| API | Cliente da API Eduzz com ferramentas auto-geradas |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente MCP                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   ┌──────────────────┐                      │
│                   │  eduzz-devhub    │                      │
│                   │  (servidor MCP)  │                      │
│                   ├──────────────────┤                      │
│                   │                  │                      │
│                   │ • Config tools   │                      │
│                   │ • Knowledge tools│                      │
│                   │ • API tools      │                      │
│                   │ • Resources      │                      │
│                   │                  │                      │
│                   └────────┬─────────┘                      │
│                            │                                │
│                     ┌──────▼──────┐                         │
│                     │  Eduzz API  │                         │
│                     └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Instalar o servidor
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
