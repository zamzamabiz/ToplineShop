import type {
  MarketplaceCategory,
  MarketplaceProduct,
  MarketplaceVendor,
  MarketplaceB2BCategory,
  MarketplaceCartItem,
  MarketplaceOrder,
  MarketplaceMetric,
  MarketplaceFilterOption,
  MarketplaceOrderTimelineStep,
  MarketplaceNavItem,
} from "@/types/marketplace";

export const marketplaceCategories: MarketplaceCategory[] = [
  { id: "cat-1", name: "Electronics", slug: "electronics", count: 120, icon: "Laptop" },
  { id: "cat-2", name: "Fashion", slug: "fashion", count: 85, icon: "Shirt" },
  { id: "cat-3", name: "Home & Garden", slug: "home-garden", count: 64, icon: "Home" },
  { id: "cat-4", name: "Sports & Outdoors", slug: "sports-outdoors", count: 42, icon: "Dumbbell" },
  { id: "cat-5", name: "Beauty & Health", slug: "beauty-health", count: 38, icon: "Sparkles" },
  { id: "cat-6", name: "Toys & Games", slug: "toys-games", count: 29, icon: "Gamepad2" },
  { id: "cat-7", name: "Books & Media", slug: "books-media", count: 21, icon: "BookOpen" },
  { id: "cat-8", name: "Baby & Kids", slug: "baby-kids", count: 18, icon: "Baby" },
];

export const featuredProducts: MarketplaceProduct[] = [
  {
    id: "prod-1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    price: "₦49,999",
    originalPrice: "₦79,999",
    currencyCode: "NGN",
    rating: 4.5,
    reviewCount: 128,
    vendor: "TechStore",
    vendorId: "vend-1",
    badge: "Sale",
    categoryId: "cat-1",
    categoryName: "Electronics",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Premium wireless Bluetooth headphones with active noise cancellation and 30-hour battery life. Designed for comfort and superior sound quality.",
    specifications: [
      { label: "Driver Size", value: "40mm" },
      { label: "Battery Life", value: "30 hours" },
      { label: "Connectivity", value: "Bluetooth 5.2" },
      { label: "Weight", value: "250g" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
  {
    id: "prod-2",
    name: "Organic Cotton T-Shirt",
    slug: "organic-cotton-t-shirt",
    price: "₦24,999",
    currencyCode: "NGN",
    rating: 4.2,
    reviewCount: 56,
    vendor: "FashionHub",
    vendorId: "vend-2",
    categoryId: "cat-2",
    categoryName: "Fashion",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Made from 100% organic cotton. Soft, breathable, and environmentally friendly. Perfect for everyday wear.",
    specifications: [
      { label: "Material", value: "100% Organic Cotton" },
      { label: "Fit", value: "Regular Fit" },
      { label: "Available Sizes", value: "S, M, L, XL" },
      { label: "Care", value: "Machine washable" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "14-day return policy",
  },
  {
    id: "prod-3",
    name: "Stainless Steel Water Bottle",
    slug: "stainless-steel-water-bottle",
    price: "₦18,999",
    currencyCode: "NGN",
    rating: 4.8,
    reviewCount: 203,
    vendor: "EcoLiving",
    vendorId: "vend-3",
    badge: "Popular",
    categoryId: "cat-3",
    categoryName: "Home & Garden",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Double-walled vacuum insulated stainless steel bottle. Keeps drinks cold for 24 hours or hot for 12 hours.",
    specifications: [
      { label: "Capacity", value: "750ml" },
      { label: "Material", value: "Stainless Steel 304" },
      { label: "Insulation", value: "Double-wall vacuum" },
      { label: "Dimensions", value: "28cm x 8cm" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
  {
    id: "prod-4",
    name: "Portable Bluetooth Speaker",
    slug: "portable-bluetooth-speaker",
    price: "₦34,999",
    originalPrice: "₦49,999",
    currencyCode: "NGN",
    rating: 4.3,
    reviewCount: 89,
    vendor: "TechStore",
    vendorId: "vend-1",
    categoryId: "cat-1",
    categoryName: "Electronics",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Compact portable Bluetooth speaker with rich bass and clear highs. IPX5 waterproof rating makes it perfect for outdoor use.",
    specifications: [
      { label: "Battery Life", value: "12 hours" },
      { label: "Connectivity", value: "Bluetooth 5.0" },
      { label: "Water Resistance", value: "IPX5" },
      { label: "Output Power", value: "10W" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
];

export const productListingItems: MarketplaceProduct[] = [
  ...featuredProducts,
  {
    id: "prod-5",
    name: "Smart Watch Fitness Tracker",
    slug: "smart-watch-fitness-tracker",
    price: "₦29,999",
    currencyCode: "NGN",
    rating: 4.1,
    reviewCount: 67,
    vendor: "TechStore",
    vendorId: "vend-1",
    categoryId: "cat-1",
    categoryName: "Electronics",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Track your fitness goals with this smartwatch. Features heart rate monitoring, step counting, and sleep tracking.",
    specifications: [
      { label: "Display", value: "1.3-inch AMOLED" },
      { label: "Battery Life", value: "7 days" },
      { label: "Water Resistance", value: "5 ATM" },
      { label: "Sensors", value: "Heart rate, SpO2, accelerometer" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
  {
    id: "prod-6",
    name: "Natural Face Moisturizer",
    slug: "natural-face-moisturizer",
    price: "₦12,999",
    currencyCode: "NGN",
    rating: 4.7,
    reviewCount: 145,
    vendor: "BeautyPlus",
    vendorId: "vend-4",
    categoryId: "cat-5",
    categoryName: "Beauty & Health",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "All-natural face moisturizer made with shea butter and essential oils. Suitable for all skin types.",
    specifications: [
      { label: "Volume", value: "100ml" },
      { label: "Skin Type", value: "All skin types" },
      { label: "Key Ingredients", value: "Shea butter, Vitamin E" },
      { label: "Fragrance", value: "Unscented" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "14-day return policy",
  },
  {
    id: "prod-7",
    name: "Yoga Mat Premium",
    slug: "yoga-mat-premium",
    price: "₦15,999",
    originalPrice: "₦22,999",
    currencyCode: "NGN",
    rating: 4.4,
    reviewCount: 78,
    vendor: "FitLife",
    vendorId: "vend-5",
    badge: "Sale",
    categoryId: "cat-4",
    categoryName: "Sports & Outdoors",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Premium non-slip yoga mat with alignment marks. Ideal for yoga, Pilates, and floor exercises.",
    specifications: [
      { label: "Thickness", value: "6mm" },
      { label: "Dimensions", value: "183cm x 68cm" },
      { label: "Material", value: "TPE (Eco-friendly)" },
      { label: "Weight", value: "1.2kg" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
  {
    id: "prod-8",
    name: "Ceramic Coffee Mug Set",
    slug: "ceramic-coffee-mug-set",
    price: "₦8,999",
    currencyCode: "NGN",
    rating: 4.6,
    reviewCount: 112,
    vendor: "HomePlus",
    vendorId: "vend-6",
    categoryId: "cat-3",
    categoryName: "Home & Garden",
    inStock: true,
    stockLabel: "In Stock",
    description:
      "Set of 4 premium ceramic coffee mugs. Microwave and dishwasher safe. Perfect for home or office use.",
    specifications: [
      { label: "Set Size", value: "4 mugs" },
      { label: "Material", value: "Ceramic" },
      { label: "Capacity", value: "350ml" },
      { label: "Care", value: "Microwave & dishwasher safe" },
    ],
    deliveryNote: "Free delivery within 3-5 business days",
    returnNote: "7-day return policy",
  },
];

export const marketplaceVendors: MarketplaceVendor[] = [
  {
    id: "vend-1",
    name: "TechStore",
    slug: "techstore",
    productCount: 156,
    rating: 4.7,
    verified: true,
    description:
      "Nigeria's leading electronics retailer. Specializing in consumer electronics, gadgets, and tech accessories since 2018.",
    location: "Lagos, Nigeria",
    joinedLabel: "Joined September 2021",
    responseRate: "98%",
    deliveryNote: "Ships within 24 hours",
    returnPolicy: "30-day return policy",
    supportNote: "24/7 customer support via chat and phone",
    storeMetrics: [
      { label: "Orders Completed", value: "12,450+" },
      { label: "Avg. Delivery Time", value: "2.3 days" },
      { label: "Response Time", value: "< 1 hour" },
      { label: "Repeat Buyers", value: "68%" },
    ],
  },
  {
    id: "vend-2",
    name: "FashionHub",
    slug: "fashionhub",
    productCount: 89,
    rating: 4.5,
    verified: true,
    description:
      "Premium fashion retailer offering trendy and sustainable clothing for men and women. Curated collections from local designers.",
    location: "Abuja, Nigeria",
    joinedLabel: "Joined March 2022",
    responseRate: "95%",
    deliveryNote: "Free shipping on orders over ₦25,000",
    returnPolicy: "14-day return policy",
    supportNote: "Support available Monday-Friday, 9am-6pm",
    storeMetrics: [
      { label: "Orders Completed", value: "5,200+" },
      { label: "Avg. Delivery Time", value: "3.1 days" },
      { label: "Response Time", value: "< 2 hours" },
      { label: "Repeat Buyers", value: "54%" },
    ],
  },
  {
    id: "vend-3",
    name: "EcoLiving",
    slug: "ecoliving",
    productCount: 67,
    rating: 4.8,
    verified: true,
    description:
      "Sustainable and eco-friendly products for home and lifestyle. All products are ethically sourced and environmentally conscious.",
    location: "Port Harcourt, Nigeria",
    joinedLabel: "Joined January 2023",
    responseRate: "97%",
    deliveryNote: "Ships within 48 hours",
    returnPolicy: "14-day return policy",
    supportNote: "Email support with 24-hour response time",
    storeMetrics: [
      { label: "Orders Completed", value: "3,890+" },
      { label: "Avg. Delivery Time", value: "2.8 days" },
      { label: "Response Time", value: "< 3 hours" },
      { label: "Repeat Buyers", value: "72%" },
    ],
  },
  {
    id: "vend-6",
    name: "HomePlus",
    slug: "homeplus",
    productCount: 112,
    rating: 4.4,
    verified: true,
    description:
      "Your one-stop shop for home essentials, kitchenware, and home decor. Quality products at wholesale-friendly prices.",
    location: "Kano, Nigeria",
    joinedLabel: "Joined August 2021",
    responseRate: "93%",
    deliveryNote: "Free delivery within Kano metropolis",
    returnPolicy: "7-day return policy",
    supportNote: "WhatsApp support available during business hours",
    storeMetrics: [
      { label: "Orders Completed", value: "8,120+" },
      { label: "Avg. Delivery Time", value: "2.5 days" },
      { label: "Response Time", value: "< 4 hours" },
      { label: "Repeat Buyers", value: "61%" },
    ],
  },
];

export const b2bBenefits = [
  { id: "b2b-1", icon: "Package", title: "Bulk Pricing", description: "Volume discounts on all wholesale orders. The more you buy, the more you save." },
  { id: "b2b-2", icon: "Truck", title: "Nationwide Delivery", description: "Reliable logistics network covering all 36 states and FCT." },
  { id: "b2b-3", icon: "FileText", title: "Request for Quotation", description: "Submit RFQs and receive competitive quotes from verified suppliers." },
  { id: "b2b-4", icon: "Users", title: "Verified Suppliers", description: "All B2B vendors are verified with business documentation." },
  { id: "b2b-5", icon: "ShieldCheck", title: "Buyer Protection", description: "Escrow-based payments protect both buyers and sellers." },
  { id: "b2b-6", icon: "Building2", title: "Business Accounts", description: "Dedicated account management for wholesale buyers." },
];

export const b2bSupplierCategories: MarketplaceB2BCategory[] = [
  { id: "b2b-cat-1", name: "Electronics & Tech", count: 45 },
  { id: "b2b-cat-2", name: "Fashion & Textiles", count: 38 },
  { id: "b2b-cat-3", name: "Food & Beverages", count: 52 },
  { id: "b2b-cat-4", name: "Building Materials", count: 29 },
  { id: "b2b-cat-5", name: "Agriculture", count: 34 },
  { id: "b2b-cat-6", name: "Industrial Equipment", count: 18 },
];

export const cartPreviewItems: MarketplaceCartItem[] = [
  { id: "cart-1", productId: "prod-1", name: "Wireless Bluetooth Headphones", vendor: "TechStore", price: "₦49,999", quantity: 1, image: null },
  { id: "cart-2", productId: "prod-2", name: "Organic Cotton T-Shirt", vendor: "FashionHub", price: "₦24,999", quantity: 2, image: null },
];

export const orderPreviewItems: MarketplaceOrder[] = [
  { id: "ORD-001", date: "2026-09-05", status: "Delivered", total: "₦49,999", items: 2, statusColor: "text-green-600" },
  { id: "ORD-002", date: "2026-09-04", status: "Shipped", total: "₦24,999", items: 1, statusColor: "text-blue-600" },
  { id: "ORD-003", date: "2026-09-03", status: "Processing", total: "₦18,999", items: 3, statusColor: "text-amber-600" },
];

export const orderTimelineSteps: MarketplaceOrderTimelineStep[] = [
  { label: "Order Placed", done: true },
  { label: "Payment Confirmed", done: true },
  { label: "Processing", done: true },
  { label: "Shipped", done: false },
  { label: "Delivered", done: false },
];

export const vendorPreviewMetrics: MarketplaceMetric[] = [
  { label: "Total Products", value: "24", change: { value: "+3 this week", positive: true } },
  { label: "Total Orders", value: "156", change: { value: "+12 this week", positive: true } },
  { label: "Revenue (MTD)", value: "₦0.00" },
  { label: "Conversion Rate", value: "0%" },
];

export const vendorNavItems: MarketplaceNavItem[] = [
  { title: "Product Management", description: "Add, edit, and manage your product catalog", icon: "Package", status: "PLANNED" },
  { title: "Order Management", description: "View and fulfill customer orders", icon: "ShoppingCart", status: "PLANNED" },
  { title: "Analytics Dashboard", description: "Track sales, views, and performance", icon: "BarChart3", status: "PLANNED" },
  { title: "Storefront Settings", description: "Customize your vendor storefront", icon: "Store", status: "PLANNED" },
  { title: "Payouts & Billing", description: "Manage payments and subscription", icon: "CreditCard", status: "PLANNED" },
  { title: "Account Settings", description: "Manage your vendor profile", icon: "Settings", status: "PLANNED" },
];

export const adminPreviewMetrics: MarketplaceMetric[] = [
  { label: "Total Users", value: "0" },
  { label: "Total Vendors", value: "0" },
  { label: "Total Products", value: "0" },
  { label: "Active Disputes", value: "0" },
];

export const adminNavItems: MarketplaceNavItem[] = [
  { title: "User Management", description: "View, suspend, and manage platform users", icon: "Users", status: "PLANNED" },
  { title: "Vendor Management", description: "Approve, review, and manage vendors", icon: "Store", status: "PLANNED" },
  { title: "Category Management", description: "Create and organize product categories", icon: "Tag", status: "PLANNED" },
  { title: "Content Moderation", description: "Review flagged content and listings", icon: "ShieldAlert", status: "PLANNED" },
  { title: "Support Queue", description: "Manage customer and vendor support tickets", icon: "Headphones", status: "PLANNED" },
  { title: "Platform Settings", description: "Configure platform-wide settings", icon: "Settings", status: "PLANNED" },
  { title: "Analytics", description: "Platform-wide analytics and reporting", icon: "BarChart3", status: "PLANNED" },
  { title: "Audit Logs", description: "System activity and change history", icon: "FileText", status: "PLANNED" },
];

export const ownerPreviewMetrics: MarketplaceMetric[] = [
  { label: "GMV (MTD)", value: "₦0.00" },
  { label: "Revenue (MTD)", value: "₦0.00", change: { value: "Commission: 0%", positive: true } },
  { label: "Active Users", value: "0" },
  { label: "Active Vendors", value: "0" },
];

export const ownerNavItems: MarketplaceNavItem[] = [
  { title: "Revenue Dashboard", description: "Track GMV, revenue, and commission earnings", icon: "BarChart3", status: "PLANNED" },
  { title: "Platform Health", description: "Monitor system status and performance", icon: "Activity", status: "PLANNED" },
  { title: "User & Vendor Oversight", description: "Manage platform participants", icon: "Users", status: "PLANNED" },
  { title: "Risk & Compliance", description: "Fraud detection and compliance monitoring", icon: "Shield", status: "PLANNED" },
  { title: "Phase & Project Status", description: "Track development progress and roadmap", icon: "FileText", status: "ACTIVE" },
  { title: "Platform Settings", description: "Configure platform-wide settings", icon: "Settings", status: "PLANNED" },
];

export const productFilterCategories: MarketplaceFilterOption[] = [
  { label: "Electronics", count: 120 },
  { label: "Fashion", count: 85 },
  { label: "Home & Garden", count: 64 },
  { label: "Sports", count: 42 },
  { label: "Beauty", count: 38 },
];

export const productFilterPriceRanges: MarketplaceFilterOption[] = [
  { label: "Under ₦5,000", count: 234 },
  { label: "₦5,000 - ₦15,000", count: 189 },
  { label: "₦15,000 - ₦50,000", count: 156 },
  { label: "Over ₦50,000", count: 101 },
];

export const productFilterRatings: MarketplaceFilterOption[] = [
  { label: "4★ & above", count: 312 },
  { label: "3★ & above", count: 445 },
];

export const productFilterAvailability: MarketplaceFilterOption[] = [
  { label: "In Stock", count: 467 },
  { label: "Pre-Order", count: 23 },
];

export const categoryFilterPriceRanges: MarketplaceFilterOption[] = [
  { label: "Under ₦5,000", count: 234 },
  { label: "₦5,000 - ₦15,000", count: 189 },
  { label: "₦15,000 - ₦50,000", count: 156 },
  { label: "₦50,000 - ₦100,000", count: 67 },
  { label: "Over ₦100,000", count: 34 },
];

export const categoryFilterRatings: MarketplaceFilterOption[] = [
  { label: "4★ & above", count: 312 },
  { label: "3★ & above", count: 445 },
  { label: "2★ & above", count: 489 },
];

export const categoryFilterVendors: MarketplaceFilterOption[] = [
  { label: "Verified Only", count: 89 },
  { label: "Top Rated", count: 45 },
];
