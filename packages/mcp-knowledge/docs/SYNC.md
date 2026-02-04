# Sync da Base de Conhecimento Eduzz

Este documento explica como funciona a sincronização da documentação da Eduzz.

## Comando

```bash
# Na raiz do eduzz-mcp/
npm run sync
```

## O que o sync faz

1. **Apaga todos os dados existentes** (páginas, imagens, índice)
2. **Crawlea** toda a documentação de `developers.eduzz.com`
3. **Extrai texto das imagens** usando OCR (Tesseract.js - 100% offline)
4. **Baixa OpenAPI** spec da API
5. **Indexa tudo** para busca semântica (embeddings locais)

**O sync SEMPRE apaga e reconstrói do zero.** Isso garante que a base esteja sempre sincronizada com a fonte.

**Funciona 100% offline** - não precisa de API key para funcionalidade completa.

## Estrutura de Dados

```
packages/mcp-knowledge/data/
├── knowledge.db.json    # Índice de busca semântica (~6MB)
└── raw/
    ├── pages/           # Páginas em Markdown
    ├── images/          # Imagens baixadas + descrições OCR
    ├── code-examples/   # Exemplos de código extraídos
    └── openapi/         # Especificação OpenAPI
```

## OCR de Imagens (Offline)

O sync usa **Tesseract.js** para extrair texto das imagens automaticamente:

- Funciona 100% offline (sem API)
- Suporta Português e Inglês
- Primeira execução baixa dados de linguagem (~15MB)
- Extrai todo texto visível: labels, botões, menus, código, etc.

**Exemplo de descrição gerada:**

```markdown
# Eduzz Zapier App Triggers

## Extracted Text

Zap sem título
rascunho último salvo agora
Gatilho
1. Eduzz
Escolha o aplicativo e o evento
Eduzz Beta
Mudar
Acontecimento (necessário)
Escolha um evento
Novo Abandono de Carrinho
Aciona quando um usuário deixa o carrinho de checkout...
Nova compra realizada
Aciona quando um usuário conclui (paga) uma compra...
Novo reembolso solicitado
Aciona quando um usuário solicita um novo reembolso...
```

## AI Enhancement (Opcional)

Se quiser descrições mais ricas (com contexto além do texto), pode usar API:

```bash
# Com OpenAI
OPENAI_API_KEY=sk-xxx npm run sync

# Ou com Anthropic
ANTHROPIC_API_KEY=sk-xxx npm run sync
```

A IA adiciona:
- Contexto sobre o que a imagem mostra
- Estrutura melhor organizada
- Descrição de elementos visuais (diagramas, setas, etc.)

**Para a maioria dos casos, o OCR offline é suficiente.**

## Fluxo para Mantenedores

1. **Atualizar documentação:**
   ```bash
   cd eduzz-mcp
   npm run sync
   ```

2. **Verificar alterações:**
   ```bash
   git status
   git diff packages/mcp-knowledge/data/
   ```

3. **Commitar:**
   ```bash
   git add packages/mcp-knowledge/data/
   git commit -m "docs: atualiza base de conhecimento Eduzz"
   ```

4. **Push** - Outros devs recebem a documentação atualizada

## Fluxo para Desenvolvedores

**Não precisa fazer nada!** A documentação já vem com o projeto.

Se quiser atualizar localmente (opcional):
```bash
npm run sync
```

## Primeira Execução

Na primeira execução, o sync baixa:
- Dados de linguagem do Tesseract (~15MB para por+eng)
- Modelo de embeddings (~30MB)

Esses arquivos são cacheados e reutilizados nas próximas execuções.

## Troubleshooting

### Erro de timeout no crawler

O Playwright pode falhar em conexões lentas. Verifique sua conexão e tente novamente.

### Imagens não baixando

Verifique se o Playwright está instalado:

```bash
npx playwright install chromium
```

### OCR não extraindo texto

- Verifique se a imagem não é muito pequena ou de baixa qualidade
- Imagens com fonte muito estilizada podem não ser reconhecidas
- SVGs não são suportados pelo OCR

### Erro no sync

Se algo der errado, basta rodar novamente:

```bash
npm run sync
```

Como o sync sempre apaga e reconstrói, não há risco de dados corrompidos.
