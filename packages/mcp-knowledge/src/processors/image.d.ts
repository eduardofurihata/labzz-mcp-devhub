import { CrawledImage } from '../types.js';
export interface ImageDescription {
    url: string;
    localPath: string;
    description: string;
    alt: string;
}
export declare class ImageProcessor {
    private worker;
    /**
     * Initialize Tesseract worker for OCR.
     * Downloads language data on first run (~15MB for por+eng).
     */
    private getWorker;
    /**
     * Terminate the OCR worker to free resources.
     */
    terminate(): Promise<void>;
    /**
     * Extract text from image using Tesseract OCR (offline).
     */
    private extractTextWithOCR;
    /**
     * Process images using offline OCR (Tesseract.js).
     * No API key required - runs 100% locally.
     */
    processImages(images: CrawledImage[]): Promise<ImageDescription[]>;
    /**
     * Process images with AI vision API (optional enhancement).
     * Provides richer descriptions than OCR alone.
     * Requires either OpenAI or Anthropic API key.
     */
    processImagesWithAI(images: CrawledImage[], options: {
        openaiApiKey?: string;
        anthropicApiKey?: string;
    }): Promise<ImageDescription[]>;
    private getMimeType;
    private describeWithOpenAI;
    private describeWithClaude;
}
//# sourceMappingURL=image.d.ts.map