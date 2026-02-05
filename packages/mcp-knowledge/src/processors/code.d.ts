import { CodeBlock } from '../types.js';
export interface ExtractedCode {
    language: string;
    code: string;
    context: string;
    category: CodeCategory;
}
export type CodeCategory = 'authentication' | 'api-call' | 'webhook' | 'error-handling' | 'data-model' | 'configuration' | 'example' | 'other';
export declare class CodeProcessor {
    private languageAliases;
    normalizeLanguage(language: string): string;
    categorizeCode(code: string, context: string): CodeCategory;
    processCodeBlocks(blocks: CodeBlock[]): ExtractedCode[];
    cleanCode(code: string): string;
    filterByLanguage(codes: ExtractedCode[], languages: string[]): ExtractedCode[];
    filterByCategory(codes: ExtractedCode[], categories: CodeCategory[]): ExtractedCode[];
}
//# sourceMappingURL=code.d.ts.map