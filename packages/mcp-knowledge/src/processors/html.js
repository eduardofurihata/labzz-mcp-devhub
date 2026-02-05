import TurndownService from 'turndown';
export class HtmlProcessor {
    turndown;
    constructor() {
        this.turndown = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
        });
        // Add custom rules for better documentation conversion
        this.turndown.addRule('codeBlock', {
            filter: (node) => {
                return (node.nodeName === 'PRE' &&
                    node.querySelector('code') !== null);
            },
            replacement: (content, node) => {
                const codeElement = node.querySelector('code');
                const className = codeElement?.className || '';
                const langMatch = className.match(/language-(\w+)/);
                const lang = langMatch ? langMatch[1] : '';
                const code = codeElement?.textContent || content;
                return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
            },
        });
        // Remove navigation elements
        this.turndown.addRule('removeNav', {
            filter: ['nav', 'header', 'footer'],
            replacement: () => '',
        });
        // Clean up sidebars
        this.turndown.addRule('removeSidebar', {
            filter: (node) => {
                const className = node.className || '';
                return (className.includes('sidebar') ||
                    className.includes('nav') ||
                    className.includes('menu'));
            },
            replacement: () => '',
        });
    }
    toMarkdown(html) {
        return this.turndown.turndown(html);
    }
    extractTitle(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            return h1Match[1].trim();
        }
        return 'Untitled';
    }
    extractMetaDescription(html) {
        const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        return metaMatch ? metaMatch[1].trim() : '';
    }
    cleanHtml(html) {
        // Remove script and style tags
        let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        // Remove comments
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
        // Remove inline styles
        cleaned = cleaned.replace(/\s*style=["'][^"']*["']/gi, '');
        return cleaned;
    }
}
//# sourceMappingURL=html.js.map