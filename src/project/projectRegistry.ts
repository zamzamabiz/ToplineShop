export type Status =
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "PARTIAL"
  | "PASS"
  | "CLOSED"
  | "DEFERRED"
  | "NOT_STARTED"
  | "ACTIVE"
  | "ENFORCED";

export interface Phase {
  id: string;
  number: number;
  name: string;
  objective: string;
  status: Status;
  progress: number;
  megaPromptTarget: number;
  megaPromptsCompleted: number;
  dependencies: string[];
  frontendGate: Status;
  backendGate: Status;
  databaseGate: Status;
  testingGate: Status;
  ownerApproval: Status;
  currentTask: string | null;
  taskCount: number;
  completedTaskCount: number;
}

export interface Task {
  id: string;
  phase: string;
  title: string;
  objective: string;
  status: Status;
  priority: "HIGH" | "MEDIUM" | "LOW";
  dependencies: string[];
  startedAt: string | null;
  completedAt: string | null;
  wdrPath: string | null;
  commitHash: string | null;
  tests: Status;
  build: Status;
  ownerApproval: Status;
  pmApproval: Status;
  notes: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  status: Status;
  phase: string;
}

export interface ArchitectureItem {
  id: string;
  layer: string;
  technology: string;
  status: Status;
  notes: string;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  status: Status;
  enforcedBy: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: Status;
  mitigation: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  decidedBy: string;
  date: string;
  status: Status;
}

export interface WdrEntry {
  id: string;
  taskId: string;
  phase: string;
  status: Status;
  date: string;
  commitHash: string | null;
  pmAudit: Status;
}

export interface ProjectRegistry {
  project: string;
  version: string;
  status: Status;
  developmentPolicy: string;
  protocol: string;
  currentPhase: string;
  currentTask: string | null;
  lastCompletedTask: string | null;
  nextPlannedTask: string;
  overallCompletion: number;
  lastUpdated: string;
  phases: Phase[];
  tasks: Task[];
  modules: Module[];
  architecture: ArchitectureItem[];
  technology: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
  };
  qualityGates: QualityGate[];
  risks: Risk[];
  decisions: Decision[];
  approvals: { owner: Status; pm: Status };
  wdrs: WdrEntry[];
  git: { initialized: boolean; lastCommit: string | null };
  github: { configured: boolean; url: string | null; pushAllowed: boolean };
  build: { lastResult: Status; lastRun: string | null };
  tests: { lastResult: Status; lastRun: string | null };
  deployment: { environment: string; status: Status }[];
}

export const projectRegistry: ProjectRegistry = {
  project: "ToplineShop",
  version: "0.1.0",
  status: "IN_PROGRESS",
  developmentPolicy: "#FDD — Frontend Development First",
  protocol: "#123",
  currentPhase: "Phase 3",
  currentTask: null,
  lastCompletedTask: "TOPLINE-P2-008",
  nextPlannedTask: "TOPLINE-P3-001",
  overallCompletion: 50,
  lastUpdated: new Date().toISOString(),
  phases: [
    {
      id: "phase-0",
      number: 0,
      name: "Foundation & Project Control",
      objective: "Establish project scaffold, governance, registry, and dashboard",
      status: "CLOSED",
      progress: 100,
      megaPromptTarget: 2,
      megaPromptsCompleted: 2,
      dependencies: [],
      frontendGate: "PASS",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 2,
      completedTaskCount: 2,
    },
    {
      id: "phase-1",
      number: 1,
      name: "UX Architecture & Design System",
      objective: "Design system tokens, component library, responsive patterns",
      status: "CLOSED",
      progress: 100,
      megaPromptTarget: 3,
      megaPromptsCompleted: 3,
      dependencies: ["phase-0"],
      frontendGate: "IN_PROGRESS",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 3,
      completedTaskCount: 3,
    },
    {
      id: "phase-2",
      number: 2,
      name: "Public B2C Marketplace Frontend",
      objective: "Complete public marketplace UI with product browsing, search, categories",
      status: "CLOSED",
      progress: 100,
      megaPromptTarget: 8,
      megaPromptsCompleted: 8,
      dependencies: ["phase-1"],
      frontendGate: "PASS",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: "TOPLINE-P2-008",
      taskCount: 8,
      completedTaskCount: 8,
    },
    {
      id: "phase-3",
      number: 3,
      name: "B2B / Wholesale Marketplace Frontend",
      objective: "Wholesale pricing, bulk ordering, B2B vendor storefronts",
      status: "IN_PROGRESS",
      progress: 12,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-2"],
      frontendGate: "PLANNED",
      backendGate: "PLANNED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: "TOPLINE-P3-001",
      taskCount: 8,
      completedTaskCount: 0,
    },
    {
      id: "phase-4",
      number: 4,
      name: "Customer Commerce Frontend",
      objective: "Cart, checkout, order history, customer account management",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-2"],
      frontendGate: "PLANNED",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-5",
      number: 5,
      name: "Vendor SaaS Frontend",
      objective: "Vendor dashboard, product management, analytics, storefront customization",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-2"],
      frontendGate: "PLANNED",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-6",
      number: 6,
      name: "Admin & Platform Owner Frontend",
      objective: "Admin panel, platform management, owner control center",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-2"],
      frontendGate: "PLANNED",
      backendGate: "NOT_STARTED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-7",
      number: 7,
      name: "Backend/API Foundation",
      objective: "NestJS backend, API architecture, service layer",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-2"],
      frontendGate: "PLANNED",
      backendGate: "PLANNED",
      databaseGate: "NOT_STARTED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-8",
      number: 8,
      name: "Database, Authentication, RBAC & Security",
      objective: "PostgreSQL, Prisma, JWT auth, role-based access control",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-7"],
      frontendGate: "PLANNED",
      backendGate: "PLANNED",
      databaseGate: "PLANNED",
      testingGate: "NOT_STARTED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-9",
      number: 9,
      name: "Real API Wiring & Marketplace Integration",
      objective: "Connect frontend to real APIs, full marketplace integration",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 4,
      megaPromptsCompleted: 0,
      dependencies: ["phase-8"],
      frontendGate: "PLANNED",
      backendGate: "PLANNED",
      databaseGate: "PLANNED",
      testingGate: "PLANNED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
    {
      id: "phase-10",
      number: 10,
      name: "Quality, Performance, Deployment & Launch",
      objective: "Testing, performance optimization, CI/CD, production deployment",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 3,
      megaPromptsCompleted: 0,
      dependencies: ["phase-9"],
      frontendGate: "PLANNED",
      backendGate: "PLANNED",
      databaseGate: "PLANNED",
      testingGate: "PLANNED",
      ownerApproval: "PLANNED",
      currentTask: null,
      taskCount: 0,
      completedTaskCount: 0,
    },
  ],
  tasks: [
    {
      id: "TOPLINE-P0-001",
      phase: "phase-0",
      title: "Greenfield Foundation + Dynamic Project Control Center",
      objective:
        "Initialize Next.js frontend, project registry, PM dashboard, WDR structure, governance documentation",
      status: "CLOSED",
      priority: "HIGH",
      dependencies: [],
      startedAt: "2026-09-06T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-00-Foundation/TOPLINE-P0-001_WDR_2026-09-06.md",
      commitHash: "e864197",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Foundation task — scaffold, registry, dashboard, governance docs",
    },
    {
      id: "TOPLINE-P0-002",
      phase: "phase-0",
      title: "Foundation Hardening + Design-System Architecture + Phase-1 Readiness",
      objective:
        "Harden foundation, prepare design system architecture, enable Phase 1 entry",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P0-001"],
      startedAt: "2026-09-06T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-00-Foundation/TOPLINE-P0-002_WDR_2026-09-06.md",
      commitHash: "727f203",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Foundation hardening, design-system prep, dashboard improvement",
    },
    {
      id: "TOPLINE-P1-001",
      phase: "phase-1",
      title: "Design System Implementation + UX Shell",
      objective:
        "Implement reusable design-system components, app shell layout, navigation architecture, and placeholder pages",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P0-002"],
      startedAt: "2026-09-06T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-01-UX-Architecture/TOPLINE-P1-001_WDR_2026-09-06.md",
      commitHash: "87d2f53",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Design system components, UX shell, placeholder pages, navigation",
    },
    {
      id: "TOPLINE-P1-002",
      phase: "phase-1",
      title: "Marketplace Layout System + Responsive UX Expansion",
      objective:
        "Expand UX shell into reusable marketplace layout system with responsive page templates",
      status: "CLOSED",
      priority: "HIGH",
      dependencies: ["TOPLINE-P1-001"],
      startedAt: "2026-09-06T00:00:00.000Z",
      completedAt: "2026-09-06T16:35:00.000Z",
      wdrPath: "WDR/_All/Phase-01-UX-Architecture/TOPLINE-P1-002_WDR_2026-09-06.md",
      commitHash: "da8b9f1",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Marketplace layout components, responsive pages, registry update",
    },
    {
      id: "TOPLINE-P2-002",
      phase: "phase-2",
      title: "Central Mock Marketplace Data + Shared Types",
      objective:
        "Create centralized mock data layer and shared TypeScript types for all marketplace pages",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-001"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-002_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Centralized mock data, shared types, currency fix, page refactors",
    },
    {
      id: "TOPLINE-P2-003",
      phase: "phase-2",
      title: "Product Listing + Category Browsing UX",
      objective:
        "Improve product listing and category browsing UX with breadcrumbs, filters, and category detail route",
      status: "CLOSED",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-002"],
      startedAt: "2026-09-07T00:00:00.000Z",
      completedAt: "2026-09-07T00:00:00.000Z",
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-003_WDR_2026-09-07.md",
      commitHash: "c6eee1b",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Breadcrumbs, filter placeholders, category detail route, UX improvements",
    },
    {
      id: "TOPLINE-P2-004",
      phase: "phase-2",
      title: "Product Detail Page UX",
      objective:
        "Create frontend-only Product Detail Page UX with mock product data, specifications, related products",
      status: "CLOSED",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-003"],
      startedAt: "2026-09-07T00:00:00.000Z",
      completedAt: "2026-09-07T00:00:00.000Z",
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-004_WDR_2026-09-07.md",
      commitHash: "19b19ca",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Product detail route, breadcrumbs, specifications, related products, disabled buttons",
    },
    {
      id: "TOPLINE-P2-005",
      phase: "phase-2",
      title: "Vendor Storefront + B2B Discovery UX",
      objective:
        "Create frontend-only Vendor Storefront UX and improve B2B Discovery UX using centralized mock data",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-004"],
      startedAt: "2026-09-07T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-005_WDR_2026-09-07.md",
      commitHash: "e0b6193",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Vendor storefront route, vendor tile linking, B2B discovery UX, vendor mock data",
    },
    {
      id: "TOPLINE-P2-006",
      phase: "phase-2",
      title: "Marketplace Homepage Refinement + Search Placeholder UX",
      objective:
        "Refine public marketplace homepage and add safe frontend-only search/discovery placeholder UX",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-005"],
      startedAt: "2026-09-07T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-006_WDR_2026-09-07.md",
      commitHash: "5f802e5",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Marketplace homepage refinement, search placeholder UX, linking polish",
    },
    {
      id: "TOPLINE-P2-007",
      phase: "phase-2",
      title: "Cart / Checkout Placeholder Safety Review",
      objective:
        "Audit and harden cart, checkout, payment, order, and commerce placeholder safety across the frontend",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-006"],
      startedAt: "2026-09-07T00:00:00.000Z",
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-007_WDR_2026-09-07.md",
      commitHash: "81ede5c",
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Safety audit and hardening of cart/checkout/commerce placeholder UX",
    },
    {
      id: "TOPLINE-P2-008",
      phase: "phase-2",
      title: "Phase 2 Frontend Freeze Gate",
      objective:
        "Full audit of Phase 2 public marketplace frontend — confirm stability, safety, mock-only, and readiness to freeze",
      status: "PASS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-007"],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      wdrPath: "WDR/_All/Phase-02-Public-Marketplace/TOPLINE-P2-008_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Phase 2 freeze gate audit — no code changes needed, governance only",
    },
    {
      id: "TOPLINE-P3-001",
      phase: "phase-3",
      title: "Backend Readiness Architecture Plan",
      objective:
        "Prepare Phase 3 backend architecture plan — stack recommendation, database direction, auth/RBAC plan, API boundaries, payment safety policy",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P2-008"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-03-Backend-Readiness/TOPLINE-P3-001_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Architecture planning only — no backend code written",
    },
    {
      id: "TOPLINE-P3-002",
      phase: "phase-3",
      title: "Backend Stack Decision + Project Structure Plan",
      objective:
        "Decide backend stack (Option C: Hybrid Next.js + NestJS), plan project structure, define frontend/backend boundary",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P3-001"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-03-Backend-Readiness/TOPLINE-P3-002_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Stack decision and project structure planning only — no backend code written",
    },
    {
      id: "TOPLINE-P3-003",
      phase: "phase-3",
      title: "Database Schema Design Document",
      objective:
        "Design database schema for multi-vendor marketplace — entities, relationships, constraints, safety rules",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P3-002"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-03-Backend-Readiness/TOPLINE-P3-003_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Database design documentation only — no schema/migrations created",
    },
    {
      id: "TOPLINE-P3-004",
      phase: "phase-3",
      title: "API Contract Design Document",
      objective:
        "Design API contracts for multi-vendor marketplace — routes, request/response, validation, auth, error handling",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P3-003"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-03-Backend-Readiness/TOPLINE-P3-004_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "API contract design documentation only — no backend/API code created",
    },
    {
      id: "TOPLINE-P3-004A",
      phase: "phase-3",
      title: "SaaS Multi-Tenant Modular Business Platform Strategy",
      objective:
        "Define ToplineShop as SaaS-first, multi-tenant, modular, multi-business platform — protect future architecture before Auth/RBAC implementation",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dependencies: ["TOPLINE-P3-004"],
      startedAt: new Date().toISOString(),
      completedAt: null,
      wdrPath: "WDR/_All/Phase-03-Backend-Readiness/TOPLINE-P3-004A_WDR_2026-09-07.md",
      commitHash: null,
      tests: "PASS",
      build: "PASS",
      ownerApproval: "PLANNED",
      pmApproval: "PLANNED",
      notes: "Strategy documentation only — no modules/backend/API implemented",
    },
  ],
  modules: [
    {
      id: "mod-public-marketplace",
      name: "Public Marketplace",
      description: "Public-facing product browsing, search, and discovery",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-search",
      name: "Search",
      description: "Product and vendor search functionality",
      status: "PLANNED",
      phase: "phase-2",
    },
    {
      id: "mod-categories",
      name: "Categories",
      description: "Product category browsing and navigation",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-products",
      name: "Products",
      description: "Product listing and detail views",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-product-detail",
      name: "Product Detail",
      description: "Individual product page with variants, images, reviews",
      status: "PLANNED",
      phase: "phase-2",
    },
    {
      id: "mod-vendor-store",
      name: "Vendor Store",
      description: "Individual vendor storefront pages",
      status: "PLANNED",
      phase: "phase-2",
    },
    {
      id: "mod-b2b",
      name: "B2B Wholesale",
      description: "Wholesale pricing, bulk ordering, B2B features",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-customer-account",
      name: "Customer Account",
      description: "Customer profile, order history, saved items",
      status: "PLANNED",
      phase: "phase-4",
    },
    {
      id: "mod-cart",
      name: "Cart",
      description: "Shopping cart functionality",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-checkout",
      name: "Checkout",
      description: "Checkout flow and payment integration",
      status: "PLANNED",
      phase: "phase-4",
    },
    {
      id: "mod-orders",
      name: "Orders",
      description: "Order management and tracking",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-vendor-saas",
      name: "Vendor SaaS",
      description: "Vendor dashboard, product management, analytics",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-admin",
      name: "Admin",
      description: "Platform administration panel",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-owner-control",
      name: "Owner Control Center",
      description: "Platform owner dashboard and control",
      status: "IN_PROGRESS",
      phase: "phase-1",
    },
    {
      id: "mod-auth",
      name: "Authentication",
      description: "User authentication and session management",
      status: "PLANNED",
      phase: "phase-8",
    },
    {
      id: "mod-catalog-api",
      name: "Catalog APIs",
      description: "Product and category API endpoints",
      status: "PLANNED",
      phase: "phase-7",
    },
    {
      id: "mod-commerce-api",
      name: "Commerce APIs",
      description: "Cart, checkout, order API endpoints",
      status: "PLANNED",
      phase: "phase-7",
    },
    {
      id: "mod-database",
      name: "Database",
      description: "PostgreSQL schema and Prisma ORM",
      status: "PLANNED",
      phase: "phase-8",
    },
    {
      id: "mod-testing",
      name: "Testing",
      description: "Unit, integration, and E2E testing",
      status: "PLANNED",
      phase: "phase-10",
    },
    {
      id: "mod-deployment",
      name: "Deployment",
      description: "CI/CD, Docker, production deployment",
      status: "PLANNED",
      phase: "phase-10",
    },
  ],
  architecture: [
    {
      id: "arch-frontend",
      layer: "Frontend",
      technology: "Next.js 16 + React 19 + TypeScript + Tailwind CSS",
      status: "ACTIVE",
      notes: "App Router, shadcn/ui direction",
    },
    {
      id: "arch-design-system",
      layer: "Design System",
      technology: "Custom tokens + UI primitives + lucide-react + clsx + tailwind-merge + cva",
      status: "ACTIVE",
      notes: "src/design-system/ + src/components/ui/",
    },
    {
      id: "arch-backend",
      layer: "Backend",
      technology: "NestJS (planned)",
      status: "NOT_STARTED",
      notes: "Phase 7",
    },
    {
      id: "arch-database",
      layer: "Database",
      technology: "PostgreSQL + Prisma (planned)",
      status: "NOT_STARTED",
      notes: "Phase 8",
    },
    {
      id: "arch-auth",
      layer: "Authentication",
      technology: "JWT + RBAC (planned)",
      status: "NOT_STARTED",
      notes: "Phase 8",
    },
    {
      id: "arch-api",
      layer: "API",
      technology: "REST + NestJS (planned)",
      status: "NOT_STARTED",
      notes: "Phase 7",
    },
    {
      id: "arch-caching",
      layer: "Caching",
      technology: "Redis (planned)",
      status: "NOT_STARTED",
      notes: "Phase 8+",
    },
    {
      id: "arch-queues",
      layer: "Queues",
      technology: "BullMQ (planned)",
      status: "NOT_STARTED",
      notes: "Phase 8+",
    },
    {
      id: "arch-testing",
      layer: "Testing",
      technology: "Vitest / Playwright (planned)",
      status: "NOT_STARTED",
      notes: "Phase 10",
    },
    {
      id: "arch-cicd",
      layer: "CI/CD",
      technology: "GitHub Actions + Docker (planned)",
      status: "NOT_STARTED",
      notes: "Phase 10",
    },
    {
      id: "arch-deployment",
      layer: "Deployment",
      technology: "Docker + Cloud (planned)",
      status: "NOT_STARTED",
      notes: "Phase 10",
    },
    {
      id: "arch-observability",
      layer: "Observability",
      technology: "Monitoring stack (planned)",
      status: "NOT_STARTED",
      notes: "Phase 10",
    },
  ],
  technology: {
    frontend: [
      "Next.js 16",
      "React 19",
      "TypeScript 5",
      "Tailwind CSS 4",
      "shadcn/ui (planned)",
      "Lucide React (planned)",
      "TanStack Query (planned)",
      "Zustand (planned)",
      "React Hook Form (planned)",
      "Zod (planned)",
    ],
    backend: ["NestJS (planned)"],
    database: ["PostgreSQL (planned)", "Prisma (planned)"],
    infrastructure: [
      "Docker (planned)",
      "Redis (planned)",
      "BullMQ (planned)",
      "CI/CD (planned)",
    ],
  },
  qualityGates: [
    {
      id: "qg-fdd",
      name: "#FDD — Frontend Development First",
      description: "Frontend behavior must be proved before deep backend work",
      status: "ENFORCED",
      enforcedBy: "Protocol #123",
    },
    {
      id: "qg-123",
      name: "#123 — Governance Protocol",
      description: "DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT",
      status: "ENFORCED",
      enforcedBy: "Project Constitution",
    },
    {
      id: "qg-frontend-freeze",
      name: "Frontend Freeze Gate",
      description: "All frontend screens pass visual verification before backend",
      status: "PLANNED",
      enforcedBy: "Phase 2 completion",
    },
    {
      id: "qg-backend-gate",
      name: "Backend Gate",
      description: "Backend foundation ready before API wiring",
      status: "PLANNED",
      enforcedBy: "Phase 7 completion",
    },
    {
      id: "qg-database-gate",
      name: "Database Gate",
      description: "Schema finalized and migrated before real data wiring",
      status: "PLANNED",
      enforcedBy: "Phase 8 completion",
    },
    {
      id: "qg-test-gate",
      name: "Test Gate",
      description: "Test coverage meets threshold before deployment",
      status: "PLANNED",
      enforcedBy: "Phase 10",
    },
    {
      id: "qg-wdr",
      name: "WDR Compliance",
      description: "Every governed task requires a WDR with evidence",
      status: "ENFORCED",
      enforcedBy: "Protocol #123",
    },
    {
      id: "qg-owner-approval",
      name: "Owner Approval",
      description: "Owner sign-off required for phase closure",
      status: "PLANNED",
      enforcedBy: "Protocol #123",
    },
    {
      id: "qg-pm-approval",
      name: "PM Approval",
      description: "PM audit required before starting next governed task",
      status: "ENFORCED",
      enforcedBy: "Protocol #123",
    },
  ],
  risks: [
    {
      id: "risk-001",
      title: "No active risks",
      description: "Foundation phase — no technical risks identified yet",
      severity: "LOW",
      status: "CLOSED",
      mitigation: "N/A",
    },
  ],
  decisions: [
    {
      id: "decision-001",
      title: "Greenfield project confirmed",
      description: "ToplineShop starts from zero. shop.com is out of scope.",
      decidedBy: "Owner + PM",
      date: "2026-09-06",
      status: "CLOSED",
    },
    {
      id: "decision-002",
      title: "Frontend-first #FDD policy",
      description: "All development follows frontend-first approach.",
      decidedBy: "PM",
      date: "2026-09-06",
      status: "CLOSED",
    },
    {
      id: "decision-003",
      title: "Next.js + Tailwind frontend stack",
      description: "Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui direction.",
      decidedBy: "PM",
      date: "2026-09-06",
      status: "CLOSED",
    },
  ],
  approvals: {
    owner: "PLANNED",
    pm: "PLANNED",
  },
  wdrs: [
    {
      id: "wdr-001",
      taskId: "TOPLINE-P0-001",
      phase: "phase-0",
      status: "CLOSED",
      date: "2026-09-06",
      commitHash: "e864197",
      pmAudit: "PASS",
    },
    {
      id: "wdr-002",
      taskId: "TOPLINE-P0-002",
      phase: "phase-0",
      status: "PASS",
      date: "2026-09-06",
      commitHash: "727f203",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-003",
      taskId: "TOPLINE-P1-001",
      phase: "phase-1",
      status: "PASS",
      date: "2026-09-06",
      commitHash: "87d2f53",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-004",
      taskId: "TOPLINE-P1-002",
      phase: "phase-1",
      status: "PASS",
      date: "2026-09-06",
      commitHash: "da8b9f1",
      pmAudit: "PASS",
    },
    {
      id: "wdr-005",
      taskId: "TOPLINE-P2-001",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "c6eee1b",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-006",
      taskId: "TOPLINE-P2-002",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "feefda5",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-007",
      taskId: "TOPLINE-P2-003",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "d4549e7",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-008",
      taskId: "TOPLINE-P2-004",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "7b3b9f2",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-009",
      taskId: "TOPLINE-P2-005",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "e0b6193",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-010",
      taskId: "TOPLINE-P2-006",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "5f802e5",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-011",
      taskId: "TOPLINE-P2-007",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "81ede5c",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-012",
      taskId: "TOPLINE-P2-008",
      phase: "phase-2",
      status: "PASS",
      date: "2026-09-07",
      commitHash: null,
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-013",
      taskId: "TOPLINE-P3-001",
      phase: "phase-3",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "52b0c88",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-014",
      taskId: "TOPLINE-P3-002",
      phase: "phase-3",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "e114771",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-015",
      taskId: "TOPLINE-P3-003",
      phase: "phase-3",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "eab9d01",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-016",
      taskId: "TOPLINE-P3-004",
      phase: "phase-3",
      status: "PASS",
      date: "2026-09-07",
      commitHash: "438ffae",
      pmAudit: "PLANNED",
    },
    {
      id: "wdr-017",
      taskId: "TOPLINE-P3-004A",
      phase: "phase-3",
      status: "PASS",
      date: "2026-09-07",
      commitHash: null,
      pmAudit: "PLANNED",
    },
  ],
  git: {
    initialized: true,
    lastCommit: "81ede5c",
  },
  github: {
    configured: true,
    url: "https://github.com/zamzamabiz/ToplineShop",
    pushAllowed: false,
  },
  build: {
    lastResult: "PASS",
    lastRun: new Date().toISOString(),
  },
  tests: {
    lastResult: "PASS",
    lastRun: new Date().toISOString(),
  },
  deployment: [
    {
      environment: "development",
      status: "IN_PROGRESS",
    },
    {
      environment: "staging",
      status: "NOT_STARTED",
    },
    {
      environment: "production",
      status: "NOT_STARTED",
    },
  ],
};
