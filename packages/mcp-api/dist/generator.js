import { z } from 'zod';
export class ToolGenerator {
    spec;
    client;
    constructor(spec, client) {
        this.spec = spec;
        this.client = client;
    }
    schemaToZod(schema) {
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
                    return z.enum(schema.enum);
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
                const shape = {};
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
    generateToolName(method, path, operationId) {
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
    buildInputSchema(parameters, requestBody) {
        const shape = {};
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
                }
                else {
                    shape.body = bodySchema;
                }
            }
        }
        return z.object(shape);
    }
    generateTools() {
        const tools = [];
        if (!this.spec.paths) {
            return tools;
        }
        for (const [path, methods] of Object.entries(this.spec.paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
                    continue;
                }
                const op = operation;
                const toolName = this.generateToolName(method, path, op.operationId);
                const description = op.summary || op.description || `${method.toUpperCase()} ${path}`;
                const inputSchema = this.buildInputSchema(op.parameters || [], op.requestBody);
                const tool = {
                    name: toolName,
                    description,
                    inputSchema,
                    handler: async (params) => {
                        const typedParams = params;
                        // Build path with parameters
                        let finalPath = path;
                        const queryParams = {};
                        for (const param of op.parameters || []) {
                            const value = typedParams[param.name];
                            if (value !== undefined) {
                                if (param.in === 'path') {
                                    finalPath = finalPath.replace(`{${param.name}}`, String(value));
                                }
                                else if (param.in === 'query') {
                                    queryParams[param.name] = value;
                                }
                            }
                        }
                        const response = await this.client.request({
                            method: method.toUpperCase(),
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
    generateToolsMap() {
        const tools = this.generateTools();
        return new Map(tools.map((t) => [t.name, t]));
    }
}
//# sourceMappingURL=generator.js.map