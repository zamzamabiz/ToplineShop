export interface ApiMeta {
  count?: number;
  phase?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  ok: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export interface RootData {
  message: string;
  status: string;
}

export interface HealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  checks: {
    api: string;
    prisma: string;
    database: string;
    auth: string;
    payments: string;
  };
}

export interface VersionData {
  service: string;
  version: string;
  phase: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TenantDetail extends TenantSummary {}

export interface VendorSummary {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VendorDetail extends VendorSummary {}

export interface CategorySummary {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  status: string;
  sortOrder: number;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CategoryDetail extends CategorySummary {}

export interface ProductSummary {
  id: string;
  tenantId: string;
  vendorId: string;
  categoryId: string;
  name: string;
  status: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProductDetail extends ProductSummary {}

export interface ProductFilters {
  tenantId?: string;
  vendorId?: string;
  categoryId?: string;
  status?: string;
}
