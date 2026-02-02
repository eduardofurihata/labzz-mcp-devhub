import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { CrawledImage } from '../types.js';

export interface ImageDescription {
  url: string;
  localPath: string;
  description: string;
  alt: string;
}

export class ImageProcessor {
  /**
   * Process images and generate descriptions.
   * Uses alt text as the description (no API required).
   * For AI-powered descriptions, use processImagesWithAI().
   */
  async processImages(images: CrawledImage[]): Promise<ImageDescription[]> {
    const descriptions: ImageDescription[] = [];

    for (const img of images) {
      const descriptionPath = img.localPath.replace(/\.[^.]+$/, '.description.md');

      // Check if description already exists
      if (existsSync(descriptionPath)) {
        const existingDescription = readFileSync(descriptionPath, 'utf-8');
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: existingDescription,
          alt: img.alt,
        });
        continue;
      }

      // Use alt text as description (no API required)
      const description = img.alt || 'Image from Eduzz documentation';

      // Save description
      const dir = dirname(descriptionPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(descriptionPath, description, 'utf-8');

      descriptions.push({
        url: img.url,
        localPath: img.localPath,
        description,
        alt: img.alt,
      });
    }

    return descriptions;
  }

  /**
   * Process images with AI vision API (optional).
   * Requires either OpenAI or Anthropic API key.
   */
  async processImagesWithAI(
    images: CrawledImage[],
    options: {
      openaiApiKey?: string;
      anthropicApiKey?: string;
    }
  ): Promise<ImageDescription[]> {
    const descriptions: ImageDescription[] = [];

    for (const img of images) {
      const descriptionPath = img.localPath.replace(/\.[^.]+$/, '.description.md');

      if (existsSync(descriptionPath)) {
        const existingDescription = readFileSync(descriptionPath, 'utf-8');
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: existingDescription,
          alt: img.alt,
        });
        continue;
      }

      if (!existsSync(img.localPath)) {
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: img.alt || 'Image not found',
          alt: img.alt,
        });
        continue;
      }

      let description = img.alt || 'Image from Eduzz documentation';

      // Try OpenAI first
      if (options.openaiApiKey) {
        try {
          description = await this.describeWithOpenAI(img.localPath, img.alt, options.openaiApiKey);
        } catch (error) {
          console.error(`OpenAI vision failed for ${img.localPath}:`, error);
        }
      }
      // Fall back to Anthropic
      else if (options.anthropicApiKey) {
        try {
          description = await this.describeWithClaude(img.localPath, img.alt, options.anthropicApiKey);
        } catch (error) {
          console.error(`Claude vision failed for ${img.localPath}:`, error);
        }
      }

      // Save description
      const dir = dirname(descriptionPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(descriptionPath, description, 'utf-8');

      descriptions.push({
        url: img.url,
        localPath: img.localPath,
        description,
        alt: img.alt,
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return descriptions;
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[ext || ''] || 'image/png';
  }

  private async describeWithOpenAI(imagePath: string, alt: string, apiKey: string): Promise<string> {
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.getMimeType(imagePath);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this documentation image concisely. Include any visible text, diagrams, or code.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content || alt || 'Unable to describe image';
  }

  private async describeWithClaude(imagePath: string, alt: string, apiKey: string): Promise<string> {
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mediaType = this.getMimeType(imagePath) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Image },
              },
              {
                type: 'text',
                text: 'Describe this documentation image concisely. Include any visible text, diagrams, or code.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json() as {
      content?: Array<{ text?: string }>;
    };

    return data.content?.[0]?.text || alt || 'Unable to describe image';
  }
}
