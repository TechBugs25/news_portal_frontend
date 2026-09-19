import { API_BASE_URL, TOKEN_STORAGE_KEY } from './constants';

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token !== undefined ? options.token : getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let responseData: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    if (typeof responseData === 'object' && responseData !== null) {
      if (Array.isArray(responseData.message)) {
        errorMessage = responseData.message.join(', ');
      } else if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      }
    }
    throw new ApiError(errorMessage, response.status, responseData);
  }

  // Unwrap backend response envelopes ({ success: true, data: ... })
  return unwrapResponse<T>(responseData);
}

function unwrapResponse<T>(responseData: any): T {
  let current = responseData;
  let meta: any = undefined;

  while (
    current &&
    typeof current === 'object' &&
    'data' in current &&
    ('success' in current || 'statusCode' in current)
  ) {
    if ('meta' in current) {
      meta = current.meta;
    }
    current = current.data;
  }

  // If payload is already { data: [...], meta: {...} }
  if (
    current &&
    typeof current === 'object' &&
    'data' in current &&
    'meta' in current
  ) {
    return current as T;
  }

  // If it is an array and we found metadata, attach it as non-enumerable or property
  if (Array.isArray(current) && meta) {
    (current as any).meta = meta;
  }

  return current as T;
}

export async function uploadMediaAsset(file: File, caption?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) {
    formData.append('caption', caption);
  }

  return apiClient<any>('/media/upload', {
    method: 'POST',
    body: formData,
  });
}
