import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import OpenAI from 'openai';
import { CrawledImage } from '../types.js';

export interface ImageDescription {
  url: string;
  localPath: string;
  description: string;
  alt: string;
  transcribedText?: string;
}

export class ImageProcessor {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async describeImage(imagePath: string, alt: string): Promise<string> {
    if (!this.openai) {
      return alt || 'Image description unavailable (no OpenAI API key configured)';
    }

    if (!existsSync(imagePath)) {
      return alt || 'Image not found';
    }

    try {
      const imageBuffer = readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are analyzing documentation images for the Eduzz API documentation.
Please provide:
1. A detailed description of what this image shows
2. If the image contains text, code, or diagrams, transcribe or describe them
3. How this image relates to API documentation (e.g., flow diagram, UI screenshot, code example)

Keep your response concise but informative. Focus on technical details that would be useful for developers.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || alt || 'Unable to describe image';
    } catch (error) {
      console.error(`Error describing image ${imagePath}:`, error);
      return alt || 'Error describing image';
    }
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

      // Generate new description
      const description = await this.describeImage(img.localPath, img.alt);

      // Save description
      const dir = dirname(descriptionPath);
      if (!existsSync(dir)) {
        const { mkdirSync } = await import('node:fs');
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(descriptionPath, description, 'utf-8');

      descriptions.push({
        url: img.url,
        localPath: img.localPath,
        description,
        alt: img.alt,
      });

      // Rate limiting for OpenAI API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return descriptions;
  }

  async processImagesWithClaude(
    images: CrawledImage[],
    anthropicApiKey: string
  ): Promise<ImageDescription[]> {
    // Alternative implementation using Claude API
    // This can be used if Claude is preferred over GPT-4V
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

      try {
        const imageBuffer = readFileSync(img.localPath);
        const base64Image = imageBuffer.toString('base64');
        const mediaType = this.getMimeType(img.localPath) as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: mediaType,
                      data: base64Image,
                    },
                  },
                  {
                    type: 'text',
                    text: `Analyze this documentation image from Eduzz API docs. Describe:
1. What the image shows
2. Any text, code, or diagrams (transcribe if present)
3. Technical relevance for developers

Be concise but thorough.`,
                  },
                ],
              },
            ],
          }),
        });

        const data = (await response.json()) as {
          content?: Array<{ text?: string }>;
        };
        const description = data.content?.[0]?.text || img.alt || 'Unable to describe image';

        writeFileSync(descriptionPath, description, 'utf-8');

        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description,
          alt: img.alt,
        });
      } catch (error) {
        console.error(`Error describing image with Claude ${img.localPath}:`, error);
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: img.alt || 'Error describing image',
          alt: img.alt,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return descriptions;
  }
}
