# Instalação

## Método Rápido (Recomendado)

Um único comando para instalar todos os servidores MCP:

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup
```

### Escopo Global

Para disponibilizar em todos os projetos:

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup --global
```

## Método Manual

Se preferir instalar cada servidor individualmente:

```bash
# Configuração de perfis
claude mcp add eduzz-config -- npx --yes github:eduardofurihata/labzz-mcp-devhub eduzz-config serve

# Base de conhecimento
claude mcp add eduzz-knowledge -- npx --yes github:eduardofurihata/labzz-mcp-devhub eduzz-knowledge serve

# Cliente da API
claude mcp add eduzz-api -- npx --yes github:eduardofurihata/labzz-mcp-devhub eduzz-api serve
```

## Via .mcp.json

Crie um arquivo `.mcp.json` na raiz do seu projeto:

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

## Verificando a Instalação

Após instalar, reinicie o Claude Code e verifique:

```bash
claude mcp list
```

Você deve ver os três servidores listados:
- `eduzz-config`
- `eduzz-knowledge`
- `eduzz-api`

## Atualizando

Para atualizar para a versão mais recente:

```bash
# 1. Limpar cache do npx
rm -rf ~/.npm/_npx

# 2. Remover servidores antigos
claude mcp remove eduzz-config && claude mcp remove eduzz-knowledge && claude mcp remove eduzz-api

# 3. Reinstalar
npx github:eduardofurihata/labzz-mcp-devhub setup
```

## Removendo

Para remover os servidores:

```bash
claude mcp remove eduzz-config && claude mcp remove eduzz-knowledge && claude mcp remove eduzz-api
```

## Troubleshooting

### Erro: "Failed to connect"

1. Verifique se o Node.js >= 18 está instalado: `node --version`
2. Limpe o cache do npm: `npm cache clean --force`
3. Tente reinstalar: `npx --yes github:eduardofurihata/labzz-mcp-devhub setup`

### Erro: "Command not found: claude"

Instale o Claude Code CLI:
```bash
npm install -g @anthropic-ai/claude-code
```

### Servidores não aparecem após instalação

Reinicie completamente o Claude Code (feche e abra novamente).
