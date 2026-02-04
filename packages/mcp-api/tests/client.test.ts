import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EduzzAPIClient } from '../src/client.js';

describe('EduzzAPIClient', () => {
  let client: EduzzAPIClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new EduzzAPIClient({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      environment: 'sandbox',
      retryAttempts: 1,
      retryDelay: 10,
    });

    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should make GET request with correct headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
      headers: new Headers(),
    });

    await client.get('/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toBe('https://api-sandbox.eduzz.com/test');
    expect(options.method).toBe('GET');
    expect(options.headers['X-Api-Key']).toBe('test-api-key');
    expect(options.headers['X-Api-Timestamp']).toBeDefined();
    expect(options.headers['X-Api-Signature']).toBeDefined();
  });

  it('should include query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });

    await client.get('/test', { page: 1, limit: 10 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
  });

  it('should handle POST with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
      headers: new Headers(),
    });

    const body = { name: 'Test', value: 123 };
    await client.post('/items', body);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(body));
  });

  it('should return success response', async () => {
    const responseData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
      headers: new Headers(),
    });

    const result = await client.get('/test');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(responseData);
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ code: 'INVALID_REQUEST', message: 'Invalid data' }),
      headers: new Headers(),
    });

    const result = await client.get('/test');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_REQUEST');
    expect(result.error?.message).toBe('Invalid data');
    expect(result.statusCode).toBe(400);
  });

  it('should use production URL when configured', async () => {
    const prodClient = new EduzzAPIClient({
      apiKey: 'key',
      apiSecret: 'secret',
      environment: 'production',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });

    await prodClient.get('/test');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.eduzz.com/test');
  });

  it('should parse rate limit headers', async () => {
    const headers = new Headers({
      'x-ratelimit-remaining': '99',
      'x-ratelimit-limit': '100',
      'x-ratelimit-reset': '1700000000',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers,
    });

    await client.get('/test');

    const rateLimit = client.getRateLimitInfo();
    expect(rateLimit?.remaining).toBe(99);
    expect(rateLimit?.limit).toBe(100);
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await client.get('/test');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('REQUEST_FAILED');
  });
});
