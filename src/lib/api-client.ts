import type {
  ApiResponse,
  ApiError,
  RootData,
  HealthData,
  VersionData,
  TenantSummary,
  VendorSummary,
  CategorySummary,
  ProductSummary,
  ProductFilters,
  CreateTenantRequest,
  CreateVendorRequest,
  CreateCategoryRequest,
  CreateProductRequest,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error: ApiError = {
        code: `HTTP_${response.status}`,
        message: `Request failed with status ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();

    if (data.ok === false) {
      throw data.error as ApiError;
    }

    return data as ApiResponse<T>;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      throw err as ApiError;
    }

    const error: ApiError = {
      code: "NETWORK_ERROR",
      message:
        err instanceof Error ? err.message : "Failed to connect to API",
    };
    throw error;
  }
}

async function postApi<TRequest, TResponse>(
  endpoint: string,
  data: TRequest,
): Promise<ApiResponse<TResponse>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = {
        code: `HTTP_${response.status}`,
        message: `Request failed with status ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    const responseBody = await response.json();

    if (responseBody.ok === false) {
      throw responseBody.error as ApiError;
    }

    return responseBody as ApiResponse<TResponse>;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      throw err as ApiError;
    }

    const error: ApiError = {
      code: "NETWORK_ERROR",
      message:
        err instanceof Error ? err.message : "Failed to connect to API",
    };
    throw error;
  }
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined,
  ) as [string, string][];
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams(entries);
  return `?${searchParams.toString()}`;
}

export const api = {
  getRoot() {
    return fetchApi<RootData>("/");
  },

  getHealth() {
    return fetchApi<HealthData>("/health");
  },

  getVersion() {
    return fetchApi<VersionData>("/version");
  },

  getTenants() {
    return fetchApi<TenantSummary[]>("/tenants");
  },

  getTenant(id: string) {
    return fetchApi<TenantSummary>(`/tenants/${encodeURIComponent(id)}`);
  },

  getVendors() {
    return fetchApi<VendorSummary[]>("/vendors");
  },

  getVendor(id: string) {
    return fetchApi<VendorSummary>(`/vendors/${encodeURIComponent(id)}`);
  },

  getCategories() {
    return fetchApi<CategorySummary[]>("/categories");
  },

  getCategory(id: string) {
    return fetchApi<CategorySummary>(`/categories/${encodeURIComponent(id)}`);
  },

  getProducts(filters?: ProductFilters) {
    const query = filters
      ? buildQueryString(filters as Record<string, string | undefined>)
      : "";
    return fetchApi<ProductSummary[]>(`/products${query}`);
  },

  getProduct(id: string) {
    return fetchApi<ProductSummary>(`/products/${encodeURIComponent(id)}`);
  },

  // -------------------------------------------------------------------------
  // Write methods — Phase 7 Backend/API Foundation (P7-009)
  //
  // Only POST /tenants, POST /vendors, POST /categories, POST /products are
  // implemented on the backend today. PATCH/DELETE write methods are
  // deferred until the backend controllers expose matching endpoints.
  // -------------------------------------------------------------------------

  createTenant(data: CreateTenantRequest) {
    return postApi<CreateTenantRequest, TenantSummary>("/tenants", data);
  },

  createVendor(data: CreateVendorRequest) {
    return postApi<CreateVendorRequest, VendorSummary>("/vendors", data);
  },

  createCategory(data: CreateCategoryRequest) {
    return postApi<CreateCategoryRequest, CategorySummary>(
      "/categories",
      data,
    );
  },

  createProduct(data: CreateProductRequest) {
    return postApi<CreateProductRequest, ProductSummary>("/products", data);
  },
};
