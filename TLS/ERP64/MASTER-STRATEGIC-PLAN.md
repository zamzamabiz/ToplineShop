# ERP64 Master Strategic Plan

Version: 1.1

Status: owner-approved governance baseline on 2026-09-12. Stage A remains in progress under the existing ToplineShop registry.

## Direction

ERP64 will be a modular, multi-tenant business platform with an Odoo-style application structure and Shopify-style simplicity, subscriptions, hosting, and optional custom domains.

ERP64 is the proposed umbrella brand and `erp64.com` is the proposed primary domain. ToplineShop remains the current project identity during Stage A and becomes the Commerce and Marketplace application after a separately approved brand and architecture transition. No repository-wide rename or source relocation is authorized by this plan.

## Vision

Provide businesses worldwide with one simple platform for commerce, customer management, orders, distribution, operations, and data intelligence.

## Mission

Deliver a secure shared foundation and add useful business applications gradually, allowing each customer to activate only the modules they need.

## Platform Rules

- One platform identity, tenant model, login, permission system, module registry, and audit system.
- Shared interfaces with clear module ownership and data boundaries.
- One codebase initially; independently deployable profiles only for commercially proven major modules.
- Web application first, cross-platform by design, mobile applications later.
- Prefer maintained, commercially suitable open-source technology; record unavoidable service and infrastructure costs.
- Keep operational module data authoritative. Data Refinery consumes governed copies or events for quality, analytics, and signals.
- New ideas enter discovery or backlog and do not expand the active release automatically.

## Customer Experience

The normal journey is: Login -> Select company -> ERP64 dashboard -> Module launcher -> Permitted module.

Module access requires four independent checks: authenticated user, tenant membership, package entitlement, and role permission. Module states may include Active, Trial, Setup Required, Locked, Payment Required, Suspended, and Coming Soon.

Eligible tenants may use `company.erp64.com` and connect a verified custom domain. ERP64 remains responsible for secure tenant routing, certificates, permissions, and platform operation.

## Shared Core

The shared core owns identity, tenants, roles, permissions, module registry, entitlements, subscriptions, usage metering, notifications, audit logs, integration contracts, custom-domain mapping, and platform administration.

Applications own their business workflows and internal data. Modules exchange information only through approved contracts, APIs, or events.

## Three Stages

### Stage A - Complete the Existing Foundation

Complete the current P0-P10 ToplineShop roadmap and freeze Foundation v1. Preserve current governance, scope, and WDR authority. Security corrections and verified architecture conflicts remain eligible for controlled corrective tasks.

### Stage B - Establish ERP64 and Deliver Selected Modules

Approve the ERP64 platform shell, module registry, entitlement model, and module contracts. Deliver Data Refinery with Trade Intelligence as the first urgent vertical workflow. Add CRM, Order Booker, Delivery, FMCG Distribution, Commodity Operations, and broader ERP Analytics according to approved business priority.

Normally allow one platform workstream and one implementation module at a time. Another module may remain in discovery or frontend design.

### Stage C - Global SaaS and Scale

Introduce commercial packages, usage limits, custom domains, localization, APIs, mobile clients, operational support, high-volume validation, and independently deployable profiles for proven modules.

## Mandatory Governance

Every work package follows #123: DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT.

Every product workflow follows #FDD: DESIGN -> VISUAL PROOF -> OWNER APPROVAL -> FRONTEND FREEZE -> BACKEND -> INTEGRATION -> VERIFICATION.

Data-heavy modules may run bounded feasibility experiments before frontend freeze. Each experiment must state its question, data, limits, and result. It cannot establish a permanent backend or bypass approval.

## Commercial Model

Begin with tenant subscriptions, paid modules, included users, storage/data allowances, premium support, implementation services, and controlled custom-domain access. Trade Intelligence may later add record-volume, export, alert, and API tiers. Add transaction fees only where ERP64 directly provides a transaction or payment service.

## Completion Standard

A feature closes only when approved behavior works, relevant checks pass, permissions and tenant boundaries are verified, performance meets its agreed target, evidence and WDR are recorded, findings are closed, and required owner approval is present.

A commercial module additionally requires security review, backup restoration, support ownership, entitlement and billing verification, legal/data-rights review, deployment evidence, and rollback evidence.
