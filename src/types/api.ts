export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface HealthCheckData {
  status: string;
  check: string;
  timestamp: string;
  uptimeSeconds?: number;
  memoryUsage?: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
  services?: {
    database?: {
      status: string;
      type: string;
      latencyMs: number;
    };
    redis?: {
      status: string;
      type: string;
      latencyMs: number;
    };
  };
}
