import { z } from 'zod';

export interface APIClientConfig {
  apiKey: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  statusCode: number;
  headers: Record<string, string>;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface GeneratedTool {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  handler: (params: unknown) => Promise<unknown>;
}

export const BASE_URLS = {
  sandbox: 'https://api-sandbox.eduzz.com',
  production: 'https://api.eduzz.com',
} as const;

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}
