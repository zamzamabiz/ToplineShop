# ToplineShop — Master Phase Plan

## Phase 0: Foundation & Project Control
**Status**: CLOSED  
**Objective**: Establish project scaffold, governance, registry, and dashboard.  
**Tasks**: TOPLINE-P0-001, TOPLINE-P0-002

## Phase 1: UX Architecture & Design System
**Status**: CLOSED  
**Objective**: Design system tokens, component library, responsive patterns.  
**Dependencies**: Phase 0

## Phase 2: Public B2C Marketplace Frontend
**Status**: CLOSED  
**Objective**: Complete public marketplace UI — product browsing, search, categories, vendor stores.  
**Dependencies**: Phase 1

## Phase 3: Backend Readiness + B2B Foundation
**Status**: IN_PROGRESS  
**Objective**: Backend architecture planning, database design, auth/RBAC design, API contracts, backend bootstrap.  
**Dependencies**: Phase 2
**Current Task**: TOPLINE-P3-005 (Auth/RBAC Design)
**Note**: P3-005 Auth/RBAC design must support SaaS multi-tenant modular platform strategy.

## Phase 4: Customer Commerce Frontend
**Status**: PLANNED  
**Objective**: Cart, checkout, order history, customer account management.  
**Dependencies**: Phase 3

## Phase 5: Vendor SaaS Frontend
**Status**: PLANNED  
**Objective**: Vendor dashboard, product management, analytics, storefront customization.  
**Dependencies**: Phase 3

## Phase 6: Admin & Platform Owner Frontend
**Status**: PLANNED  
**Objective**: Admin panel, platform management, owner control center.  
**Dependencies**: Phase 3

## Phase 7: Backend/API Foundation
**Status**: PLANNED  
**Objective**: NestJS backend, API architecture, service layer.  
**Dependencies**: Phase 2

## Phase 8: Database, Authentication, RBAC & Security
**Status**: PLANNED  
**Objective**: PostgreSQL, Prisma, JWT auth, role-based access control.  
**Dependencies**: Phase 7

## Phase 9: Real API Wiring & Marketplace Integration
**Status**: PLANNED  
**Objective**: Connect frontend to real APIs, full marketplace integration.  
**Dependencies**: Phase 8

## Phase 10: Quality, Performance, Deployment & Launch
**Status**: PLANNED  
**Objective**: Testing, performance optimization, CI/CD, production deployment.  
**Dependencies**: Phase 9
