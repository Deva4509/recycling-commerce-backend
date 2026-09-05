export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description?: string | null;
  description?: string | null;
  base_price: string | number;
  currency: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
