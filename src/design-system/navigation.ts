export const navItems = [
  { label: "Home", href: "/", description: "Project landing page" },
  {
    label: "App Shell",
    href: "/app",
    description: "Main application shell preview",
  },
  {
    label: "Control Center",
    href: "/project-management",
    description: "Project management dashboard",
  },
] as const;

export const appNavItems = [
  { label: "Dashboard", href: "/app", icon: "LayoutDashboard" },
  { label: "Marketplace", href: "/marketplace", icon: "Store" },
  { label: "Categories", href: "/categories", icon: "Tag" },
  { label: "Products", href: "/products", icon: "Package" },
  { label: "B2B Wholesale", href: "/b2b", icon: "Truck" },
  { label: "Cart", href: "/cart", icon: "ShoppingCart" },
  { label: "Orders", href: "/orders", icon: "ShoppingBag" },
  { label: "Vendor SaaS", href: "/vendor", icon: "Settings" },
  { label: "Admin", href: "/admin", icon: "Shield" },
  { label: "Owner Control", href: "/owner", icon: "Crown" },
] as const;

export const dashboardNavSections = [
  {
    id: "overview",
    label: "Overview",
    description: "Executive summary and key metrics",
  },
  {
    id: "phases",
    label: "Phases",
    description: "Phase timeline and progress",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task registry and status",
  },
  {
    id: "modules",
    label: "Modules",
    description: "Product module map",
  },
  {
    id: "architecture",
    label: "Architecture",
    description: "Technology and architecture status",
  },
  {
    id: "governance",
    label: "Governance",
    description: "Quality gates and compliance",
  },
  {
    id: "risks",
    label: "Risks",
    description: "Risk and blocker panel",
  },
  {
    id: "wdr",
    label: "WDR",
    description: "Work done records",
  },
  {
    id: "tree",
    label: "Structure",
    description: "Project tree view",
  },
] as const;
