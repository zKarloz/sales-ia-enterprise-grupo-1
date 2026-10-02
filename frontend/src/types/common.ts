export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface SelectOption {
  label: string;
  value: string;
}