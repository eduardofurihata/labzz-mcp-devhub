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
export declare class ToolGenerator {
    private spec;
    private client;
    constructor(spec: OpenAPISpec, client: EduzzAPIClient);
    private schemaToZod;
    private generateToolName;
    private buildInputSchema;
    generateTools(): GeneratedTool[];
    generateToolsMap(): Map<string, GeneratedTool>;
}
export {};
//# sourceMappingURL=generator.d.ts.map