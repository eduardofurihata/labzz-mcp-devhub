import { z } from 'zod';
import { GeneratedTool } from './types.js';
import { EduzzAPIClient } from './client.js';

interface OpenAPISpec {
  paths?: Record<string, Record<string, PathOperation>>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

interface PathOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
}

interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

interface RequestBodyObject {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
}

interface MediaTypeObject {
  schema?: SchemaObject;
}

interface ResponseObject {
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

interface SchemaObject {
  type?: string;
  format?: string;
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  enum?: unknown[];
  description?: string;
  $ref?: string;
}

export class ToolGenerator {
  private spec: OpenAPISpec;
  private client: EduzzAPIClient;

  constructor(spec: OpenAPISpec, client: EduzzAPIClient) {
    this.spec = spec;
    this.client = client;
  }

  private schemaToZod(schema: SchemaObject | undefined): z.ZodType {
    if (!schema) {
      return z.unknown();
    }

    if (schema.$ref) {
      const refPath = schema.$ref.split('/');
      const schemaName = refPath[refPath.length - 1];
      const refSchema = this.spec.components?.schemas?.[schemaName];
      return this.schemaToZod(refSchema);
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return z.enum(schema.enum as [string, ...string[]]);
        }
        if (schema.format === 'date') {
          return z.string().describe(schema.description || 'Date string');
        }
        if (schema.format === 'date-time') {
          return z.string().describe(schema.description || 'ISO 8601 datetime');
        }
        if (schema.format === 'email') {
          return z.string().email().describe(schema.description || 'Email address');
        }
        return z.string().describe(schema.description || '');

      case 'integer':
      case 'number':
        return z.number().describe(schema.description || '');

      case 'boolean':
        return z.boolean().describe(schema.description || '');

      case 'array':
        return z.array(this.schemaToZod(schema.items)).describe(schema.description || '');

      case 'object':
        if (!schema.properties) {
          return z.record(z.unknown()).describe(schema.description || '');
        }

        const shape: Record<string, z.ZodType> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const isRequired = schema.required?.includes(key);
          let zodType = this.schemaToZod(propSchema);

          if (!isRequired) {
            zodType = zodType.optional();
          }

          shape[key] = zodType;
        }
        return z.object(shape).describe(schema.description || '');

      default:
        return z.unknown();
    }
  }

  private generateToolName(method: string, path: string, operationId?: string): string {
    if (operationId) {
      // Convert operationId to snake_case
      return `eduzz_${operationId
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')}`;
    }

    // Generate from path
    const cleanPath = path
      .replace(/^\//, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/\//g, '_')
      .replace(/[^a-z0-9_]/gi, '')
      .toLowerCase();

    return `eduzz_${cleanPath}_${method.toLowerCase()}`;
  }

  private buildInputSchema(
    parameters: ParameterObject[],
    requestBody?: RequestBodyObject
  ): z.ZodObject<Record<string, z.ZodType>> {
    const shape: Record<string, z.ZodType> = {};

    // Add path/query parameters
    for (const param of parameters) {
      if (param.in === 'path' || param.in === 'query') {
        let zodType = this.schemaToZod(param.schema);

        if (param.description) {
          zodType = zodType.describe(param.description);
        }

        if (!param.required) {
          zodType = zodType.optional();
        }

        shape[param.name] = zodType;
      }
    }

    // Add request body
    if (requestBody) {
      const jsonContent = requestBody.content?.['application/json'];
      if (jsonContent?.schema) {
        const bodySchema = this.schemaToZod(jsonContent.schema);
        if (!requestBody.required) {
          shape.body = bodySchema.optional();
        } else {
          shape.body = bodySchema;
        }
      }
    }

    return z.object(shape);
  }

  generateTools(): GeneratedTool[] {
    const tools: GeneratedTool[] = [];

    if (!this.spec.paths) {
      return tools;
    }

    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          continue;
        }

        const op = operation as PathOperation;
        const toolName = this.generateToolName(method, path, op.operationId);
        const description = op.summary || op.description || `${method.toUpperCase()} ${path}`;
        const inputSchema = this.buildInputSchema(op.parameters || [], op.requestBody);

        const tool: GeneratedTool = {
          name: toolName,
          description,
          inputSchema,
          handler: async (params: unknown) => {
            const typedParams = params as Record<string, unknown>;

            // Build path with parameters
            let finalPath = path;
            const queryParams: Record<string, string | number | boolean> = {};

            for (const param of op.parameters || []) {
              const value = typedParams[param.name];
              if (value !== undefined) {
                if (param.in === 'path') {
                  finalPath = finalPath.replace(`{${param.name}}`, String(value));
                } else if (param.in === 'query') {
                  queryParams[param.name] = value as string | number | boolean;
                }
              }
            }

            const response = await this.client.request({
              method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
              path: finalPath,
              query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
              body: typedParams.body,
            });

            return response;
          },
        };

        tools.push(tool);
      }
    }

    return tools;
  }

  generateToolsMap(): Map<string, GeneratedTool> {
    const tools = this.generateTools();
    return new Map(tools.map((t) => [t.name, t]));
  }
}
