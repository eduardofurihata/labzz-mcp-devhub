# @eduzz/mcp-knowledge

Eduzz documentation knowledge base with semantic search, powered by OpenAI embeddings.

## Installation

```bash
npm install @eduzz/mcp-knowledge
```

## CLI Usage

```bash
# Sync knowledge base
OPENAI_API_KEY=sk-... eduzz-knowledge sync

# Force full re-sync
OPENAI_API_KEY=sk-... eduzz-knowledge sync --force

# Start MCP server
OPENAI_API_KEY=sk-... eduzz-knowledge serve
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `eduzz_search` | Semantic search across documentation |
| `eduzz_get_example` | Get code examples by topic/language |
| `eduzz_get_endpoint` | Get API endpoint documentation |
| `eduzz_sync` | Synchronize knowledge base |
| `eduzz_stats` | Knowledge base statistics |

## MCP Resources

| URI | Description |
|-----|-------------|
| `eduzz://docs/overview` | Documentation overview |
| `eduzz://openapi/spec.json` | OpenAPI specification |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | For embeddings generation |
| `ANTHROPIC_API_KEY` | No | For image descriptions with Claude |
| `EDUZZ_SYNC_SCHEDULE` | No | Cron schedule for auto-sync (default: `0 3 * * 0`) |

## Programmatic Usage

```typescript
import { KnowledgeSyncer, LocalEmbeddingsManager } from '@eduzz/mcp-knowledge';

// Sync knowledge base
const syncer = new KnowledgeSyncer();
const result = await syncer.sync({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  onProgress: console.log,
});

// Search
const embeddings = new LocalEmbeddingsManager({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  storagePath: '~/.eduzz-mcp',
});

const results = await embeddings.search('how to authenticate', {
  limit: 10,
  filter: { type: 'doc' },
});
```

## Storage Structure

```
~/.eduzz-mcp/
├── knowledge.db.json     # Vector embeddings
└── raw/
    ├── pages/            # Crawled documentation (markdown)
    ├── images/           # Downloaded images + descriptions
    ├── code-examples/    # Extracted code examples
    └── openapi/          # API specifications
```

## License

MIT
