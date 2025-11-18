// Generic API types
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
  httpStatus?: number;
  errors?: Record<string, string[]>;
}

export function isSuccessResponse<T>(response: ApiResponse<T>): boolean {
  return response.code === 0 || (response.httpStatus !== undefined && response.httpStatus >= 200 && response.httpStatus < 300);
}

export interface PageResponseDto<T = unknown> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
