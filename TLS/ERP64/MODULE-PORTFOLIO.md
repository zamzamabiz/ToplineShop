# ERP64 Module Portfolio

This document records capability boundaries. It is not a complete feature specification or implementation authorization.

| Module ID | Application | Initial purpose | Standalone candidate | Current state |
| --- | --- | --- | --- | --- |
| `ERP64-COMMERCE` | ToplineShop Commerce | Marketplace, vendors, products, B2B, cart, and orders | Yes, after Stage A | Stage A in progress |
| `ERP64-DATA-REFINERY` | Data Refinery | Ingestion, mapping, quality, lineage, analytical preparation, and governed outputs | Platform capability | Planning |
| `ERP64-TRADE-INTEL` | Trade Intelligence | Import/export search, dashboards, market intelligence, and CRM opportunities | Yes | First proposed Stage B application |
| `ERP64-CRM` | CRM | Accounts, contacts, leads, pipeline, activities, and opportunity management | Yes | Discovery backlog |
| `ERP64-ORDER-BOOKER` | Order Booker | Field ordering, customer visits, pricing, promotions, and later offline/mobile use | Possible | Backlog |
| `ERP64-DELIVERY` | Delivery and Riders | Assignment, routing, delivery status, collections, returns, and proof of delivery | Possible | Backlog |
| `ERP64-FMCG` | FMCG Distribution | Territories, distributors, inventory, sales, credit, claims, and distribution control | Possible | Backlog |
| `ERP64-COMMODITY-OPS` | Commodity Processing & Business Management | Procurement, commission agents, milling, processing, manufacturing, trading, costing, logistics, and settlement | Yes | Backlog |
| `ERP64-ERP-ANALYTICS` | ERP Analytics | Cross-module metrics, dashboards, quality, and controlled business signals | Platform capability | Future |

## Feature-Planning Rule

Do not draft exhaustive features for every module now. That would create stale requirements and excessive maintenance.

Use three levels of detail:

1. Portfolio level now: purpose, customers, major capabilities, boundaries, integrations, commercial value, and standalone eligibility.
2. Module discovery before development: workflows, actors, data objects, permissions, routes, reports, exclusions, risks, and MVP acceptance criteria.
3. Task level after frontend freeze: exact behavior, allowed files, contracts, tests, evidence, and stop conditions, and WDR output.

New features discovered during implementation enter the backlog unless they are required to satisfy an already approved acceptance criterion.
