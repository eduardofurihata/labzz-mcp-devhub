# @eduzz/mcp-config

Credential and profile management for Eduzz MCP Suite.

## Installation

```bash
npm install @eduzz/mcp-config
```

## CLI Usage

```bash
# Interactive setup
eduzz-config setup

# List profiles
eduzz-config list

# Switch active profile
eduzz-config switch <name>

# Delete profile
eduzz-config delete <name>

# Start MCP server
eduzz-config serve
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `eduzz_profile_list` | List all configured profiles |
| `eduzz_profile_switch` | Switch to a different profile |
| `eduzz_profile_create` | Create a new profile |
| `eduzz_profile_delete` | Delete a profile |
| `eduzz_profile_active` | Get active profile info |

## Programmatic Usage

```typescript
import { ConfigManager } from '@eduzz/mcp-config';

const manager = new ConfigManager();

// Create profile
manager.createProfile('sandbox', 'api-key', 'api-secret', 'sandbox');

// List profiles
const profiles = manager.listProfiles();

// Get active profile
const active = manager.getActiveProfile();

// Switch profile
manager.switchProfile('production');
```

## Configuration File

Stored at `~/.eduzz-mcp/config.json`:

```json
{
  "active_profile": "sandbox",
  "profiles": {
    "sandbox": {
      "api_key": "your-api-key",
      "api_secret": "your-api-secret",
      "environment": "sandbox"
    }
  }
}
```

## License

MIT
