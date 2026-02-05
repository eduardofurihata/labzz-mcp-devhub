import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export class OpenAPIProcessor {
    outputDir;
    constructor(outputDir) {
        this.outputDir = outputDir;
    }
    async fetchSpec(url) {
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
                return JSON.parse(text);
            }
            return JSON.parse(text);
        }
        catch (error) {
            console.error(`Error fetching OpenAPI spec from ${url}:`, error);
            return null;
        }
    }
    parseEndpoints(spec) {
        const endpoints = [];
        if (!spec.paths) {
            return endpoints;
        }
        for (const [path, methods] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
                    const op = operation;
                    const parameters = (op.parameters || []).map((p) => ({
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
                        requestBody: op.requestBody,
                        responses: op.responses || {},
                    });
                }
            }
        }
        return endpoints;
    }
    async processSpec(url) {
        const spec = await this.fetchSpec(url);
        if (!spec) {
            return null;
        }
        const endpoints = this.parseEndpoints(spec);
        const result = {
            url,
            spec: spec,
            endpoints,
        };
        // Save to file
        const specPath = join(this.outputDir, 'raw', 'openapi', 'spec.json');
        writeFileSync(specPath, JSON.stringify(result, null, 2), 'utf-8');
        return result;
    }
    loadCachedSpec() {
        const specPath = join(this.outputDir, 'raw', 'openapi', 'spec.json');
        if (!existsSync(specPath)) {
            return null;
        }
        try {
            const content = readFileSync(specPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    getEndpointDoc(spec, path, method) {
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
    generateToolSchema(endpoint) {
        const properties = {};
        const required = [];
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
            const body = endpoint.requestBody;
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
//# sourceMappingURL=openapi.js.map