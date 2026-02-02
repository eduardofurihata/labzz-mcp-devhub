import { CodeBlock } from '../types.js';

export interface ExtractedCode {
  language: string;
  code: string;
  context: string;
  category: CodeCategory;
}

export type CodeCategory =
  | 'authentication'
  | 'api-call'
  | 'webhook'
  | 'error-handling'
  | 'data-model'
  | 'configuration'
  | 'example'
  | 'other';

export class CodeProcessor {
  private languageAliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    cs: 'csharp',
    'c#': 'csharp',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    json5: 'json',
  };

  normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase().trim();
    return this.languageAliases[normalized] || normalized;
  }

  categorizeCode(code: string, context: string): CodeCategory {
    const combined = (code + ' ' + context).toLowerCase();

    // Authentication patterns
    if (
      combined.includes('api_key') ||
      combined.includes('api_secret') ||
      combined.includes('authorization') ||
      combined.includes('bearer') ||
      combined.includes('token') ||
      combined.includes('authenticate')
    ) {
      return 'authentication';
    }

    // Webhook patterns
    if (
      combined.includes('webhook') ||
      combined.includes('callback') ||
      combined.includes('notification') ||
      combined.includes('postback')
    ) {
      return 'webhook';
    }

    // Error handling patterns
    if (
      combined.includes('catch') ||
      combined.includes('error') ||
      combined.includes('exception') ||
      combined.includes('try {')
    ) {
      return 'error-handling';
    }

    // API call patterns
    if (
      combined.includes('fetch(') ||
      combined.includes('axios') ||
      combined.includes('httpclient') ||
      combined.includes('request(') ||
      combined.includes('/api/') ||
      combined.includes('curl')
    ) {
      return 'api-call';
    }

    // Data model patterns
    if (
      combined.includes('interface ') ||
      combined.includes('type ') ||
      combined.includes('class ') ||
      combined.includes('struct ') ||
      combined.includes('schema')
    ) {
      return 'data-model';
    }

    // Configuration patterns
    if (
      combined.includes('config') ||
      combined.includes('.env') ||
      combined.includes('settings') ||
      combined.includes('environment')
    ) {
      return 'configuration';
    }

    // Example patterns
    if (
      combined.includes('example') ||
      combined.includes('sample') ||
      combined.includes('demo')
    ) {
      return 'example';
    }

    return 'other';
  }

  processCodeBlocks(blocks: CodeBlock[]): ExtractedCode[] {
    return blocks.map((block) => ({
      language: this.normalizeLanguage(block.language),
      code: this.cleanCode(block.code),
      context: block.context,
      category: this.categorizeCode(block.code, block.context),
    }));
  }

  cleanCode(code: string): string {
    // Remove leading/trailing whitespace
    let cleaned = code.trim();

    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');

    // Remove excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned;
  }

  filterByLanguage(codes: ExtractedCode[], languages: string[]): ExtractedCode[] {
    const normalizedLangs = languages.map((l) => this.normalizeLanguage(l));
    return codes.filter((c) => normalizedLangs.includes(c.language));
  }

  filterByCategory(codes: ExtractedCode[], categories: CodeCategory[]): ExtractedCode[] {
    return codes.filter((c) => categories.includes(c.category));
  }
}
