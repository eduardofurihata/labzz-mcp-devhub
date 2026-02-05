import { OpenAPISpec, APIEndpoint } from '../types.js';
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
        content?: Record<string, {
            schema?: unknown;
        }>;
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
    content?: Record<string, {
        schema?: unknown;
    }>;
}
export declare class OpenAPIProcessor {
    private outputDir;
    constructor(outputDir: string);
    fetchSpec(url: string): Promise<OpenAPIDocument | null>;
    parseEndpoints(spec: OpenAPIDocument): APIEndpoint[];
    processSpec(url: string): Promise<OpenAPISpec | null>;
    loadCachedSpec(): OpenAPISpec | null;
    getEndpointDoc(spec: OpenAPISpec, path: string, method?: string): APIEndpoint | null;
    generateToolSchema(endpoint: APIEndpoint): Record<string, unknown>;
}
export {};
//# sourceMappingURL=openapi.d.ts.map