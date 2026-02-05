# Instalação

## Método Rápido (Recomendado)

Um único comando para instalar o servidor MCP:

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup
```

### Escopo Global

Para disponibilizar em todos os projetos:

```bash
npx --yes github:eduardofurihata/labzz-mcp-devhub setup --global
```

## Método Manual

Se preferir instalar manualmente:

```bash
claude mcp add eduzz-devhub -- npx --yes github:eduardofurihata/labzz-mcp-devhub serve
```

## Via .mcp.json

Crie um arquivo `.mcp.json` na raiz do seu projeto:

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

## Verificando a Instalação

Após instalar, reinicie o Claude Code e verifique:

```bash
claude mcp list
```

Você deve ver o servidor `eduzz-devhub` listado.

## Atualizando

Para atualizar para a versão mais recente:

```bash
# 1. Limpar cache do npx
rm -rf ~/.npm/_npx

# 2. Remover servidor antigo
claude mcp remove eduzz-devhub

# 3. Reinstalar
npx github:eduardofurihata/labzz-mcp-devhub setup
```

## Removendo

Para remover o servidor:

```bash
claude mcp remove eduzz-devhub
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

### Servidor não aparece após instalação

Reinicie completamente o Claude Code (feche e abra novamente).
