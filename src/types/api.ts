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

// ============================================================================
// Write request contracts — Phase 7 Backend/API Foundation
//
// Each `Create*Request` mirrors the corresponding backend DTO 1:1. Optional
// fields are marked with `?`. Enum-like fields use literal string unions so
// the frontend compiler catches typos before the request reaches the API.
//
// Only POST /tenants, POST /vendors, POST /categories, POST /products are
// implemented on the backend today (P7-004/-R2, P7-005, P7-006, P7-007).
// PATCH/DELETE write methods and their request types are deferred until the
// backend controllers expose matching endpoints.
// ============================================================================

export type TenantType = "PLATFORM" | "VENDOR";
export type TenantStatus = "ACTIVE" | "SUSPENDED";

export interface CreateTenantRequest {
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
}

export type VendorStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

export interface CreateVendorRequest {
  tenantId: string;
  name: string;
  slug: string;
  status: VendorStatus;
  description?: string;
  logo?: string;
}

export type CategoryStatus = "ACTIVE" | "HIDDEN";

export interface CreateCategoryRequest {
  tenantId: string;
  name: string;
  slug: string;
  status: CategoryStatus;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface CreateProductRequest {
  tenantId: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  basePrice: number;
  status: ProductStatus;
  description?: string;
  currency?: string;
  inStock?: boolean;
}
