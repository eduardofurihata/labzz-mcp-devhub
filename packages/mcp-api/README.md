# @eduzz/mcp-api

Eduzz API client with auto-generated tools from OpenAPI specification.

## Installation

```bash
npm install @eduzz/mcp-api
```

## Prerequisites

1. Configure credentials using `@eduzz/mcp-config`:
   ```bash
   npx eduzz-config setup
   ```

2. (Optional) Sync knowledge base for auto-generated tools:
   ```bash
   OPENAI_API_KEY=sk-... npx eduzz-knowledge sync
   ```

## CLI Usage

```bash
# Start MCP server
eduzz-api serve
```

## MCP Tools

### Core Tools

| Tool | Description |
|------|-------------|
| `eduzz_api_call` | Generic API call |
| `eduzz_api_endpoints` | List available endpoints |
| `eduzz_api_status` | Current API status |
| `eduzz_api_reload` | Reload generated tools |

### Auto-Generated Tools

Tools are automatically generated from the OpenAPI spec, e.g.:
- `eduzz_invoices_list`
- `eduzz_invoices_create`
- `eduzz_users_get`

## Programmatic Usage

```typescript
import { EduzzAPIClient } from '@eduzz/mcp-api';

const client = new EduzzAPIClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'sandbox', // or 'production'
});

// GET request
const invoices = await client.get('/invoices', { page: 1, limit: 10 });

// POST request
const newInvoice = await client.post('/invoices', {
  customer_id: 123,
  amount: 99.90,
});

// Generic request
const response = await client.request({
  method: 'PUT',
  path: '/invoices/456',
  body: { status: 'paid' },
});
```

## Features

- **Auto-generated tools**: Tools created from OpenAPI spec
- **Request signing**: Automatic HMAC signature generation
- **Rate limiting**: Automatic rate limit handling
- **Retry logic**: Exponential backoff for transient failures
- **Multi-tenant**: Support for multiple profiles

## API Response Format

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  statusCode: number;
  headers: Record<string, string>;
}
```

## License

MIT
