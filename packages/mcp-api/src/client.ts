import { createHmac } from 'node:crypto';
import {
  APIClientConfig,
  APIResponse,
  APIError,
  RequestOptions,
  BASE_URLS,
  RateLimitInfo,
} from './types.js';

export class EduzzAPIClient {
  private config: Required<APIClientConfig>;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: APIClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  private getBaseUrl(): string {
    return BASE_URLS[this.config.environment];
  }

  private generateSignature(timestamp: string, body: string): string {
    const payload = `${timestamp}${body}`;
    return createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.getBaseUrl());

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private parseRateLimitHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');

    if (remaining && limit) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        limit: parseInt(limit, 10),
        resetAt: reset ? new Date(parseInt(reset, 10) * 1000) : new Date(),
      };
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  async request<T = unknown>(options: RequestOptions): Promise<APIResponse<T>> {
    const { method, path, query, body, headers: customHeaders } = options;

    const url = this.buildUrl(path, query);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp, bodyString);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': this.config.apiKey,
      'X-Api-Timestamp': timestamp,
      'X-Api-Signature': signature,
      ...customHeaders,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        // Check rate limit
        if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
          const waitTime = this.rateLimitInfo.resetAt.getTime() - Date.now();
          if (waitTime > 0) {
            await this.delay(Math.min(waitTime, 60000)); // Max 1 minute wait
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: bodyString || undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        this.parseRateLimitHeaders(response.headers);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (!response.ok) {
          let errorData: APIError;

          try {
            const errorBody = await response.json() as { code?: string; message?: string; details?: unknown };
            errorData = {
              code: errorBody.code || `HTTP_${response.status}`,
              message: errorBody.message || response.statusText,
              details: errorBody.details,
            };
          } catch {
            errorData = {
              code: `HTTP_${response.status}`,
              message: response.statusText,
            };
          }

          // Retry on 5xx errors or rate limiting
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(errorData.message);

            if (attempt < this.config.retryAttempts - 1) {
              const delay = this.config.retryDelay * Math.pow(2, attempt);
              await this.delay(delay);
              continue;
            }
          }

          return {
            success: false,
            error: errorData,
            statusCode: response.status,
            headers: responseHeaders,
          };
        }

        const data = await response.json() as T;

        return {
          success: true,
          data,
          statusCode: response.status,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed after retries',
      },
      statusCode: 0,
      headers: {},
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = unknown>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'POST', path, body });
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  async delete<T = unknown>(path: string): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'DELETE', path });
  }
}
