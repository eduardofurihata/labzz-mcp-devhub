import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { OpenAPISpec, APIEndpoint, APIParameter } from '../types.js';

export interface OpenAPIDocument {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, Record<string, PathOperation>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
}

interface PathOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: unknown }>;
  };
  responses?: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
}

interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
}

interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: unknown }>;
}

export class OpenAPIProcessor {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async fetchSpec(url: string): Promise<OpenAPIDocument | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch OpenAPI spec from ${url}: ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      if (contentType.includes('yaml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
        // Basic YAML parsing for simple specs
        // For production, use a proper YAML parser
        return JSON.parse(text) as OpenAPIDocument;
      }

      return JSON.parse(text) as OpenAPIDocument;
    } catch (error) {
      console.error(`Error fetching OpenAPI spec from ${url}:`, error);
      return null;
    }
  }

  parseEndpoints(spec: OpenAPIDocument): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];

    if (!spec.paths) {
      return endpoints;
    }

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          const op = operation as PathOperation;

          const parameters: APIParameter[] = (op.parameters || []).map((p) => ({
            name: p.name,
            in: p.in,
            required: p.required || false,
            description: p.description || '',
            schema: p.schema || {},
          }));

          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: op.summary || '',
            description: op.description || '',
            parameters,
            requestBody: op.requestBody as Record<string, unknown> | undefined,
            responses: op.responses || {},
          });
        }
      }
    }

    return endpoints;
  }

  async processSpec(url: string): Promise<OpenAPISpec | null> {
    const spec = await this.fetchSpec(url);
    if (!spec) {
      return null;
    }

    const endpoints = this.parseEndpoints(spec);

    const result: OpenAPISpec = {
      url,
      spec: spec as Record<string, unknown>,
      endpoints,
    };

    // Save to file
    const specPath = join(this.outputDir, 'raw', 'openapi', 'spec.json');
    writeFileSync(specPath, JSON.stringify(result, null, 2), 'utf-8');

    return result;
  }

  loadCachedSpec(): OpenAPISpec | null {
    const specPath = join(this.outputDir, 'raw', 'openapi', 'spec.json');

    if (!existsSync(specPath)) {
      return null;
    }

    try {
      const content = readFileSync(specPath, 'utf-8');
      return JSON.parse(content) as OpenAPISpec;
    } catch {
      return null;
    }
  }

  getEndpointDoc(spec: OpenAPISpec, path: string, method?: string): APIEndpoint | null {
    const normalizedPath = path.toLowerCase();
    const normalizedMethod = method?.toUpperCase();

    for (const endpoint of spec.endpoints) {
      const endpointPath = endpoint.path.toLowerCase();

      // Exact match
      if (endpointPath === normalizedPath) {
        if (!normalizedMethod || endpoint.method === normalizedMethod) {
          return endpoint;
        }
      }

      // Pattern match (e.g., /users/{id} matches /users/123)
      const pattern = endpointPath.replace(/\{[^}]+\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(normalizedPath)) {
        if (!normalizedMethod || endpoint.method === normalizedMethod) {
          return endpoint;
        }
      }
    }

    return null;
  }

  generateToolSchema(endpoint: APIEndpoint): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of endpoint.parameters) {
      properties[param.name] = {
        ...param.schema,
        description: param.description,
      };

      if (param.required) {
        required.push(param.name);
      }
    }

    // Add body parameters if present
    if (endpoint.requestBody) {
      const body = endpoint.requestBody as {
        content?: Record<string, { schema?: Record<string, unknown> }>;
        required?: boolean;
      };

      const jsonContent = body.content?.['application/json'];
      if (jsonContent?.schema) {
        properties.body = jsonContent.schema;
        if (body.required) {
          required.push('body');
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
}
