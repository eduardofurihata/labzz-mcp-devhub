import { describe, it, expect } from 'vitest';
import { HtmlProcessor } from '../src/processors/html.js';
import { CodeProcessor } from '../src/processors/code.js';

describe('HtmlProcessor', () => {
  const processor = new HtmlProcessor();

  it('should convert HTML to markdown', () => {
    const html = '<h1>Title</h1><p>Some text</p>';
    const md = processor.toMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('Some text');
  });

  it('should extract code blocks correctly', () => {
    const html = '<pre><code class="language-javascript">const x = 1;</code></pre>';
    const md = processor.toMarkdown(html);
    expect(md).toContain('```javascript');
    expect(md).toContain('const x = 1;');
    expect(md).toContain('```');
  });

  it('should extract title from HTML', () => {
    const html = '<html><head><title>Page Title</title></head></html>';
    const title = processor.extractTitle(html);
    expect(title).toBe('Page Title');
  });

  it('should extract title from h1 if no title tag', () => {
    const html = '<h1>Main Heading</h1>';
    const title = processor.extractTitle(html);
    expect(title).toBe('Main Heading');
  });

  it('should extract meta description', () => {
    const html = '<meta name="description" content="This is a description">';
    const desc = processor.extractMetaDescription(html);
    expect(desc).toBe('This is a description');
  });

  it('should clean HTML by removing scripts and styles', () => {
    const html = '<script>alert("x")</script><style>.foo{}</style><p>Content</p>';
    const cleaned = processor.cleanHtml(html);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('<style>');
    expect(cleaned).toContain('<p>Content</p>');
  });
});

describe('CodeProcessor', () => {
  const processor = new CodeProcessor();

  it('should normalize language aliases', () => {
    expect(processor.normalizeLanguage('js')).toBe('javascript');
    expect(processor.normalizeLanguage('ts')).toBe('typescript');
    expect(processor.normalizeLanguage('py')).toBe('python');
    expect(processor.normalizeLanguage('c#')).toBe('csharp');
  });

  it('should categorize authentication code', () => {
    const code = 'const token = getAuthToken();';
    const category = processor.categorizeCode(code, 'Authentication example');
    expect(category).toBe('authentication');
  });

  it('should categorize API call code', () => {
    const code = 'fetch("/api/users").then(r => r.json())';
    const category = processor.categorizeCode(code, '');
    expect(category).toBe('api-call');
  });

  it('should categorize webhook code', () => {
    const code = 'app.post("/webhook", handleCallback)';
    const category = processor.categorizeCode(code, 'Webhook handler');
    expect(category).toBe('webhook');
  });

  it('should categorize error handling code', () => {
    const code = 'try { doSomething(); } catch (error) { console.error(error); }';
    const category = processor.categorizeCode(code, '');
    expect(category).toBe('error-handling');
  });

  it('should process code blocks', () => {
    const blocks = [
      { language: 'js', code: 'const x = 1;', context: 'Example' },
      { language: 'typescript', code: 'const y: number = 2;', context: '' },
    ];

    const processed = processor.processCodeBlocks(blocks);

    expect(processed).toHaveLength(2);
    expect(processed[0].language).toBe('javascript');
    expect(processed[1].language).toBe('typescript');
  });

  it('should clean code', () => {
    const code = '  \n\nconst x = 1;\n\n\n\nconst y = 2;  \n';
    const cleaned = processor.cleanCode(code);
    expect(cleaned).toBe('const x = 1;\n\nconst y = 2;');
  });

  it('should filter by language', () => {
    const codes = [
      { language: 'javascript', code: 'x', context: '', category: 'example' as const },
      { language: 'python', code: 'y', context: '', category: 'example' as const },
      { language: 'typescript', code: 'z', context: '', category: 'example' as const },
    ];

    const filtered = processor.filterByLanguage(codes, ['javascript', 'ts']);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.language)).toEqual(['javascript', 'typescript']);
  });
});
