import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import Tesseract from 'tesseract.js';
import { CrawledImage } from '../types.js';

export interface ImageDescription {
  url: string;
  localPath: string;
  description: string;
  alt: string;
}

export class ImageProcessor {
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialize Tesseract worker for OCR.
   * Downloads language data on first run (~15MB for por+eng).
   */
  private async getWorker(): Promise<Tesseract.Worker> {
    if (!this.worker) {
      console.log('Initializing OCR engine (first run downloads language data)...');
      this.worker = await Tesseract.createWorker(['por', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\rOCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
    }
    return this.worker;
  }

  /**
   * Terminate the OCR worker to free resources.
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Extract text from image using Tesseract OCR (offline).
   */
  private async extractTextWithOCR(imagePath: string): Promise<string> {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(imagePath);
      process.stdout.write('\n'); // New line after progress
      return data.text.trim();
    } catch (error) {
      console.error(`OCR failed for ${imagePath}:`, error);
      return '';
    }
  }

  /**
   * Process images using offline OCR (Tesseract.js).
   * No API key required - runs 100% locally.
   */
  async processImages(images: CrawledImage[]): Promise<ImageDescription[]> {
    const descriptions: ImageDescription[] = [];

    console.log(`Processing ${images.length} images with OCR...`);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const descriptionPath = img.localPath.replace(/\.[^.]+$/, '.description.md');

      console.log(`[${i + 1}/${images.length}] Processing: ${img.localPath}`);

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

      if (!existsSync(img.localPath)) {
        descriptions.push({
          url: img.url,
          localPath: img.localPath,
          description: img.alt || 'Image not found',
          alt: img.alt,
        });
        continue;
      }

      // Skip SVG files (not supported by OCR)
      const ext = img.localPath.toLowerCase().split('.').pop();
      if (ext === 'svg') {
        const title = img.alt || 'SVG Image';
        const description = `# ${title}\n\n_SVG images cannot be processed with OCR_\n`;

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
        continue;
      }

      // Extract text using OCR
      const extractedText = await this.extractTextWithOCR(img.localPath);

      // Build description markdown
      const title = img.alt || 'Eduzz Documentation Image';
      let description = `# ${title}\n\n`;

      if (extractedText) {
        description += `## Extracted Text\n\n\`\`\`\n${extractedText}\n\`\`\`\n`;
      } else {
        description += `## Extracted Text\n\n_No text detected in image_\n`;
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
    }

    // Cleanup worker
    await this.terminate();

    return descriptions;
  }

  /**
   * Process images with AI vision API (optional enhancement).
   * Provides richer descriptions than OCR alone.
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

    const prompt = `Analyze this documentation image and provide:

1. **Title**: A brief descriptive title (use the alt text "${alt}" as reference if helpful)

2. **Extracted Text**: Extract ALL visible text from the image exactly as shown, preserving structure:
   - Menu items, labels, buttons
   - Form fields and their descriptions
   - Error messages, tooltips
   - Code snippets
   - Any other readable text

3. **Context**: Brief description of what the image shows (UI screen, diagram, code example, etc.)

Format the response as markdown with clear sections.`;

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
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 1500,
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

    const prompt = `Analyze this documentation image and provide:

1. **Title**: A brief descriptive title (use the alt text "${alt}" as reference if helpful)

2. **Extracted Text**: Extract ALL visible text from the image exactly as shown, preserving structure:
   - Menu items, labels, buttons
   - Form fields and their descriptions
   - Error messages, tooltips
   - Code snippets
   - Any other readable text

3. **Context**: Brief description of what the image shows (UI screen, diagram, code example, etc.)

Format the response as markdown with clear sections.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
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
                text: prompt,
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
