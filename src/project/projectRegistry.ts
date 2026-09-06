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
  currentTask: string;
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
  currentPhase: "Phase 1",
  currentTask: "TOPLINE-P1-001",
  lastCompletedTask: "TOPLINE-P0-002",
  nextPlannedTask: "TOPLINE-P1-001",
  overallCompletion: 12,
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
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 3,
      megaPromptsCompleted: 0,
      dependencies: ["phase-0"],
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
      id: "phase-2",
      number: 2,
      name: "Public B2C Marketplace Frontend",
      objective: "Complete public marketplace UI with product browsing, search, categories",
      status: "PLANNED",
      progress: 0,
      megaPromptTarget: 5,
      megaPromptsCompleted: 0,
      dependencies: ["phase-1"],
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
      id: "phase-3",
      number: 3,
      name: "B2B / Wholesale Marketplace Frontend",
      objective: "Wholesale pricing, bulk ordering, B2B vendor storefronts",
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
  ],
  modules: [
    {
      id: "mod-public-marketplace",
      name: "Public Marketplace",
      description: "Public-facing product browsing, search, and discovery",
      status: "PLANNED",
      phase: "phase-2",
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
      status: "PLANNED",
      phase: "phase-2",
    },
    {
      id: "mod-products",
      name: "Products",
      description: "Product listing and detail views",
      status: "PLANNED",
      phase: "phase-2",
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
      status: "PLANNED",
      phase: "phase-3",
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
      status: "PLANNED",
      phase: "phase-4",
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
      status: "PLANNED",
      phase: "phase-4",
    },
    {
      id: "mod-vendor-saas",
      name: "Vendor SaaS",
      description: "Vendor dashboard, product management, analytics",
      status: "PLANNED",
      phase: "phase-5",
    },
    {
      id: "mod-admin",
      name: "Admin",
      description: "Platform administration panel",
      status: "PLANNED",
      phase: "phase-6",
    },
    {
      id: "mod-owner-control",
      name: "Owner Control Center",
      description: "Platform owner dashboard and control",
      status: "PLANNED",
      phase: "phase-6",
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
      technology: "Custom tokens + UI primitives (Phase 1 ready)",
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
  ],
  git: {
    initialized: true,
    lastCommit: "ad1cd29",
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
