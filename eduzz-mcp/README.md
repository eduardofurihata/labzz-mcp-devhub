# Eduzz MCP Suite

A complete MCP (Model Context Protocol) integration suite for the Eduzz platform, providing:

- **@eduzz/mcp-config** - Credential and profile management
- **@eduzz/mcp-knowledge** - Documentation knowledge base with semantic search
- **@eduzz/mcp-api** - Full API client with auto-generated tools

## Quick Start

### 1. Install

```bash
npm install @eduzz/mcp-config @eduzz/mcp-knowledge @eduzz/mcp-api
```

### 2. Configure Credentials

```bash
npx eduzz-config setup
```

This creates a profile with your Eduzz API credentials in `~/.eduzz-mcp/config.json`.

### 3. Sync Knowledge Base

```bash
npx eduzz-knowledge sync
```

This crawls the Eduzz documentation and creates a searchable knowledge base.

**No API key required!** Embeddings are generated locally using Transformers.js.

### 4. Add to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eduzz-config": {
      "command": "npx",
      "args": ["eduzz-config", "serve"]
    },
    "eduzz-knowledge": {
      "command": "npx",
      "args": ["eduzz-knowledge", "serve"]
    },
    "eduzz-api": {
      "command": "npx",
      "args": ["eduzz-api", "serve"]
    }
  }
}
```

**Note:** No environment variables needed! Everything runs locally.

## Packages

### @eduzz/mcp-config

Manages API credentials with multi-tenant support.

**Tools:**
- `eduzz_profile_list` - List all profiles
- `eduzz_profile_switch` - Switch active profile
- `eduzz_profile_create` - Create new profile
- `eduzz_profile_delete` - Delete profile
- `eduzz_profile_active` - Get active profile info

**CLI:**
```bash
eduzz-config setup          # Interactive setup
eduzz-config list           # List profiles
eduzz-config switch <name>  # Switch profile
eduzz-config serve          # Start MCP server
```

### @eduzz/mcp-knowledge

Knowledge base with semantic search powered by OpenAI embeddings.

**Tools:**
- `eduzz_search` - Semantic search across documentation
- `eduzz_get_example` - Get code examples by topic/language
- `eduzz_get_endpoint` - Get API endpoint documentation
- `eduzz_sync` - Synchronize knowledge base
- `eduzz_stats` - Knowledge base statistics

**Resources:**
- `eduzz://docs/overview` - Documentation overview
- `eduzz://openapi/spec.json` - OpenAPI specification

**CLI:**
```bash
eduzz-knowledge sync         # Sync knowledge base
eduzz-knowledge sync --force # Force full re-sync
eduzz-knowledge serve        # Start MCP server
```

**Environment Variables (all optional):**
- `OPENAI_API_KEY` - For AI-powered image descriptions
- `ANTHROPIC_API_KEY` - For AI-powered image descriptions with Claude
- `EDUZZ_SYNC_SCHEDULE` - Cron schedule for auto-sync

**Note:** No API key is required! Embeddings are generated locally.

### @eduzz/mcp-api

API client with auto-generated tools from OpenAPI spec.

**Tools:**
- `eduzz_api_call` - Generic API call
- `eduzz_api_endpoints` - List available endpoints
- `eduzz_api_status` - Current API status
- `eduzz_api_reload` - Reload generated tools
- Auto-generated tools from OpenAPI (e.g., `eduzz_invoices_list`)

**CLI:**
```bash
eduzz-api serve  # Start MCP server
```

## Storage

All data is stored in `~/.eduzz-mcp/`:

```
~/.eduzz-mcp/
├── config.json           # Profiles and credentials
├── knowledge.db.json     # Vector embeddings
└── raw/
    ├── pages/            # Crawled documentation (markdown)
    ├── images/           # Downloaded images + descriptions
    ├── code-examples/    # Extracted code examples
    └── openapi/          # API specifications
```

## Development

```bash
# Clone and install
git clone https://github.com/eduzz/mcp-suite
cd eduzz-mcp
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Multi-Tenant Usage

Create multiple profiles for different environments:

```bash
# Create sandbox profile
eduzz-config setup
# Name: sandbox, Environment: sandbox

# Create production profile
eduzz-config setup
# Name: production, Environment: production

# Switch between profiles
eduzz-config switch production

# Or use profile parameter in API calls
# eduzz_api_call with profile: "sandbox"
```

## License

MIT
