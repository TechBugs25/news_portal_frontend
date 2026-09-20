import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from '@/lib/api-client';
import { TOKEN_STORAGE_KEY } from '@/lib/constants';

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('unwraps nested NestJS envelope { success: true, data: [...] }', async () => {
    const mockData = [{ id: '1', title: 'Test Article' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({
        success: true,
        statusCode: 200,
        data: mockData,
      }),
    } as unknown as Response);

    const result = await apiClient<typeof mockData>('/articles');
    expect(result).toEqual(mockData);
  });

  it('attaches Bearer token from localStorage automatically', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'test-jwt-token-xyz');

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedHeaders = options.headers;
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: { id: 'u1' } }),
      } as unknown as Response);
    });

    await apiClient('/users/me');

    expect(capturedHeaders?.get('Authorization')).toBe('Bearer test-jwt-token-xyz');
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with message and status code on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({
        statusCode: 401,
        message: 'Invalid credentials provided',
        error: 'Unauthorized',
      }),
    } as unknown as Response);

    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toThrow(ApiError);
    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toThrow('Invalid credentials provided');
  });

  it('joins array validation error messages cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({
        statusCode: 400,
        message: ['email must be an email', 'password is too short'],
      }),
    } as unknown as Response);

    await expect(apiClient('/users', { method: 'POST' })).rejects.toThrow(
      'email must be an email, password is too short',
    );
  });
});
