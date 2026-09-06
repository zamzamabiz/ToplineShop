export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  originalPrice?: string;
  currencyCode: string;
  rating: number;
  reviewCount: number;
  vendor: string;
  vendorId: string;
  badge?: string;
  image?: string;
  categoryId: string;
  categoryName?: string;
  inStock: boolean;
  stockLabel?: string;
  description?: string;
  specifications?: { label: string; value: string }[];
  deliveryNote?: string;
  returnNote?: string;
}

export interface MarketplaceVendor {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  rating: number;
  avatar?: string;
}

export interface MarketplaceB2BCategory {
  id: string;
  name: string;
  count: number;
}

export interface MarketplaceBenefit {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface MarketplaceTrustItem {
  id: string;
  label: string;
  icon: string;
}

export interface MarketplaceCartItem {
  id: string;
  productId: string;
  name: string;
  vendor: string;
  price: string;
  quantity: number;
  image: string | null;
}

export interface MarketplaceOrder {
  id: string;
  date: string;
  status: string;
  total: string;
  items: number;
  statusColor: string;
}

export interface MarketplaceMetric {
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
  icon?: string;
}

export interface MarketplaceFilterOption {
  label: string;
  count: number;
}

export interface MarketplaceOrderTimelineStep {
  label: string;
  done: boolean;
}

export interface MarketplaceNavItem {
  title: string;
  description: string;
  icon: string;
  status: string;
}
