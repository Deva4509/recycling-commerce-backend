const API_BASE = "/api/v1";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    localStorage.getItem("recyclepro-access-token") ||
    sessionStorage.getItem("recyclepro-access-token");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data as T;
}


function getToken(): string | null {
  return (
    localStorage.getItem("recyclepro-access-token") ||
    sessionStorage.getItem("recyclepro-access-token")
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "The server took too long to respond. Please check that the backend is running.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: { loc?: unknown[]; msg?: string }) => {
            const location = Array.isArray(item.loc)
              ? item.loc.join(".")
              : "request";
            return `${location}: ${item.msg || "Validation error"}`;
          })
          .join(" | ");
      } else if (data?.message) {
        message = String(data.message);
      }
    } catch {
      // Keep the default error message.
    }

    const authError =
      response.status === 401 &&
      /invalid|expired|token|credentials/i.test(message);

    if (authError) {
      localStorage.removeItem("recyclepro-access-token");
      localStorage.removeItem("recyclepro-user");
      sessionStorage.removeItem("recyclepro-access-token");
      sessionStorage.removeItem("recyclepro-user");

      window.dispatchEvent(new Event("recyclepro-auth-expired"));
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface ApiOrderSummary {
  id: string;
  status?: string;
  total_amount?: number | string;
  created_at?: string;
}

export interface ApiOrderItem {
  id?: string;
  product_id: string;
  location_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price?: number | string;
  total_price?: number | string;
}

export interface ApiOrder extends ApiOrderSummary {
  user_id?: string;
  shipping_address?: string;
  billing_address?: string | null;
  notes?: string | null;
  shipping_amount?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  items?: ApiOrderItem[];
}

export interface ApiShipment {
  id: string;
  order_id: string;
  status?: string;
  shipping_address?: string;
  carrier?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  short_description?: string | null;
  description?: string | null;
  base_price?: number | string;
  price?: number | string;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ApiAdminStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
}

export interface ApiProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
}

export const getOrder = (orderId: string) =>
  request<ApiOrder>(`/orders/${orderId}`);

export const getMyOrders = (userId: string) =>
  request<ApiOrderSummary[]>(`/orders/user/${userId}`);

export const cancelOrder = (orderId: string) =>
  request<ApiOrder>(`/orders/${orderId}/cancel`, {
    method: "POST",
  });

export const getOrderShipment = (orderId: string) =>
  request<ApiShipment>(`/shipments/order/${orderId}`);

export const getShipment = (shipmentId: string) =>
  request<ApiShipment>(`/shipments/${shipmentId}`);

export const getProducts = () =>
  request<ApiProduct[]>("/catalog/products");

export const getProduct = (productId: string) =>
  request<ApiProduct>(`/catalog/products/${productId}`);

export { request };


export const getAdminDashboard = () =>
  request<ApiAdminStats>("/admin/dashboard");

export const getAdminProducts = () =>
  request<ApiProduct[]>("/admin/products");

export const getAdminOrders = () =>
  request<ApiOrder[]>("/admin/orders");

export const getCategories = () =>
  request<ApiCategory[]>("/catalog/categories");

export const createAdminProduct = (
  payload: Omit<ApiProduct, "id">,
) =>
  request<ApiProduct>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminProduct = (
  productId: string,
  payload: Omit<ApiProduct, "id">,
) =>
  request<ApiProduct>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deactivateAdminProduct = (productId: string) =>
  request<void>(`/admin/products/${productId}`, {
    method: "DELETE",
  });

export const getProductImages = (productId: string) =>
  request<ApiProductImage[]>(
    `/admin/products/${productId}/images`,
  );

export const addProductImage = (
  productId: string,
  payload: {
    image_url: string;
    alt_text?: string | null;
    sort_order: number;
    is_primary: boolean;
  },
) =>
  request<ApiProductImage>(
    `/admin/products/${productId}/images`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

export const deleteProductImage = (
  productId: string,
  imageId: string,
) =>
  request<void>(
    `/admin/products/${productId}/images/${imageId}`,
    {
      method: "DELETE",
    },
  );

export const updateOrderStatus = (
  orderId: string,
  orderStatus: string,
) =>
  request<ApiOrder>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: orderStatus }),
  });


export interface ApiAdminCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  status: string;
  email_verified: boolean;
  orders: number;
  total_spent: number;
  created_at: string;
}

export interface ApiAdminCustomersResponse {
  customers: ApiAdminCustomer[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  stats: {
    total_customers: number;
    active_customers: number;
    new_this_month: number;
    total_spent: number;
    average_orders: number;
  };
}

export async function getAdminCustomers(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
} = {}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.page_size ?? 8));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }

  return request<ApiAdminCustomersResponse>(
    `/admin/customers?${query.toString()}`,
  );
}


export interface ApiPayment {
  id: string;
  order_id: string;
  amount: number | string;
  currency: string;
  method: string;
  status: string;
  provider?: string | null;
  provider_payment_id?: string | null;
  provider_order_id?: string | null;
  failure_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminPayment {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  provider?: string | null;
  provider_payment_id?: string | null;
  failure_reason?: string | null;
  created_at: string;
}

export interface ApiAdminPaymentsResponse {
  payments: ApiAdminPayment[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  stats: {
    total_payments: number;
    paid_payments: number;
    pending_payments: number;
    processing_payments: number;
    failed_payments: number;
    refunded_payments: number;
    cancelled_payments: number;
    total_received: number;
    total_refunded: number;
  };
}

export async function getAdminPayments(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
} = {}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.page_size ?? 10));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status && params.status !== "ALL") {
    query.set("status_filter", params.status);
  }

  return request<ApiAdminPaymentsResponse>(
    `/admin/payments?${query.toString()}`,
  );
}

export async function processAdminPayment(paymentId: string) {
  return request<ApiPayment>(
    `/payments/${paymentId}/processing`,
    { method: "POST" },
  );
}

export async function markAdminPaymentPaid(
  paymentId: string,
) {
  return request<ApiPayment>(
    `/payments/${paymentId}/paid`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function failAdminPayment(
  paymentId: string,
  failureReason?: string,
) {
  return request<ApiPayment>(
    `/payments/${paymentId}/failed`,
    {
      method: "POST",
      body: JSON.stringify({
        failure_reason: failureReason || "Payment failed.",
      }),
    },
  );
}

export async function refundAdminPayment(paymentId: string) {
  return request<ApiPayment>(
    `/payments/${paymentId}/refund`,
    { method: "POST" },
  );
}


export interface ApiAdminShipment {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  carrier?: string | null;
  tracking_number?: string | null;
  shipping_address: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAdminShipmentsResponse {
  shipments: ApiAdminShipment[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  stats: {
    total_shipments: number;
    pending: number;
    processing: number;
    shipped: number;
    in_transit: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };
}

export async function getAdminShipments(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
} = {}) {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.page_size ?? 10));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status && params.status !== "ALL") {
    query.set("status_filter", params.status);
  }

  return request<ApiAdminShipmentsResponse>(
    `/admin/shipments?${query.toString()}`,
  );
}

export async function processAdminShipment(
  shipmentId: string,
) {
  return request<ApiShipment>(
    `/shipments/${shipmentId}/processing`,
    { method: "POST" },
  );
}

export async function shipAdminShipment(
  shipmentId: string,
  carrier?: string,
  trackingNumber?: string,
) {
  return request<ApiShipment>(
    `/shipments/${shipmentId}/ship`,
    {
      method: "POST",
      body: JSON.stringify({
        carrier: carrier || undefined,
        tracking_number: trackingNumber || undefined,
      }),
    },
  );
}

export async function transitAdminShipment(
  shipmentId: string,
) {
  return request<ApiShipment>(
    `/shipments/${shipmentId}/in-transit`,
    { method: "POST" },
  );
}

export async function deliverAdminShipment(
  shipmentId: string,
) {
  return request<ApiShipment>(
    `/shipments/${shipmentId}/delivered`,
    { method: "POST" },
  );
}

export async function cancelAdminShipment(
  shipmentId: string,
) {
  return request<ApiShipment>(
    `/shipments/${shipmentId}/cancel`,
    { method: "POST" },
  );
}


export interface AdminSettingsResponse {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
  };
  settings: {
    order_alerts: boolean;
    payment_alerts: boolean;
    low_stock_alerts: boolean;
    default_currency: string;
    timezone: string;
    order_processing_enabled: boolean;
  };
}

export async function getAdminSettings(): Promise<AdminSettingsResponse> {
  return apiFetch<AdminSettingsResponse>("/admin/settings");
}

export async function updateAdminSettings(payload: Partial<AdminSettingsResponse["settings"]>) {
  return apiFetch<{ message: string }>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProfile(payload: {
  first_name: string;
  last_name: string;
  phone?: string | null;
}) {
  return apiFetch<{ message: string }>("/admin/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return apiFetch<{ message: string }>("/admin/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface ApiReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string;
}

export interface ApiReviewListResponse {
  items: ApiReview[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiRatingDistribution {
  one: number;
  two: number;
  three: number;
  four: number;
  five: number;
}

export interface ApiRatingSummary {
  average: number;
  total: number;
  distribution: ApiRatingDistribution;
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment: string;
}

export const getProductReviews = (
  productId: string,
  page = 1,
  pageSize = 10,
) =>
  request<ApiReviewListResponse>(
    `/products/${productId}/reviews?page=${page}&page_size=${pageSize}`,
  );

export const getProductRating = (productId: string) =>
  request<ApiRatingSummary>(`/products/${productId}/rating`);

export const createProductReview = (
  productId: string,
  payload: CreateReviewPayload,
) =>
  request<ApiReview>(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateProductReview = (
  reviewId: string,
  payload: CreateReviewPayload,
) =>
  request<ApiReview>(`/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteProductReview = (reviewId: string) =>
  request<void>(`/reviews/${reviewId}`, {
    method: "DELETE",
  });

