# Chohan Corporate Platform Plan

Status: Phase 1 admin/content prototype implemented in the sandbox.

## Executive decision

Chohan should use two connected products, not one overloaded website:

1. **Corporate site**: fast, public, editorial and trust-building. It covers the company, sectors, capabilities, responsibility, stories, careers, events, gallery and contact.
2. **Trade intelligence and B2B platform**: authenticated, data-heavy and operational. It owns the Pakistan import/export dataset, partner discovery, saved searches, alerts, enquiries and later transactions.

The corporate site should never load 20 million trade records into the browser. It may consume carefully designed aggregate signals later, such as top sectors, origin markets or export opportunity summaries.

## Cargill research translated for Chohan

Cargill's current structure is useful as a model for information architecture: About, Stories, Products & Services, Sustainability, News, Careers, Contact and Worldwide navigation. Its homepage also connects purpose, people, products, planet and news. See https://www.cargill.com/ and https://www.cargill.com/about.

Chohan should adapt the pattern at startup scale:

- About Chohan: approach, history, leadership, governance and locations.
- Businesses: import sourcing, Pakistan export, grains and food systems, industrial supply, logistics and market intelligence.
- Responsibility: quality, food safety, ethical sourcing, people and community impact.
- Stories: insights, news and practical trade perspectives.
- Events: briefings, exhibitions, partner roundtables and community programmes.
- Careers and Contact: focused conversion paths.
- Worldwide: Dubai office, Karachi office and an eventual country/partner map.

Do not copy Cargill's text, images, brand, navigation labels or visual treatment exactly.

## Admin master control

The sandbox prototype is available at `/chohan-industries/admin`. It demonstrates:

- Approved theme presets and custom color tokens.
- Hero eyebrow, heading and copy editing.
- Hero image replacement and gallery image previews.
- Events content model direction.
- Local draft save/reset and a visible production-governance warning.

Production implementation should use the existing ToplineShop NestJS, Prisma, authentication and audit modules:

- `SiteSettings`: tenant, active theme, color tokens, typography choices and logo references.
- `ContentPage`: slug, locale, status, SEO fields and structured sections.
- `ContentRevision`: immutable JSON snapshot, author, created time and approval state.
- `MediaAsset`: object-storage key, checksum, mime type, dimensions, alt text, rights/expiry and focal point.
- `GalleryItem`: asset, caption, category, sort order and publish status.
- `CompanyEvent`: title, summary, start/end time, location, registration URL, hero asset and status.
- `PublishRelease`: approved revision bundle, published by, published at and rollback pointer.

Required workflow: draft -> preview -> reviewer approval -> publish -> audit event -> rollback.

The admin must be protected by ToplineShop authentication, tenant isolation and role permissions. Recommended roles are `SITE_EDITOR`, `MEDIA_MANAGER`, `EVENT_MANAGER`, `REVIEWER` and `SITE_ADMIN`.

## Media policy

The admin may replace pictures without code changes, but every upload needs:

- type and size validation;
- generated responsive variants;
- alt text and editorial caption;
- rights/source and expiry metadata;
- focal point for responsive crops;
- moderation and audit history;
- safe deletion behavior that preserves published revisions.

Use object storage for media, not database blobs. Keep the corporate site CDN-friendly.

## Trade-data and B2B boundary

The 20M-record dataset belongs in a separate ingestion and analytics pipeline:

- immutable raw import files;
- normalized trade facts and dimensions;
- country, HS code, company, port and time dimensions;
- partitioning by year/trade direction and indexes for common filters;
- asynchronous ingestion jobs with validation and replay;
- aggregate tables or materialized views for dashboard speed;
- tenant-aware API with pagination, rate limits and export controls;
- no direct database access from the public corporate frontend.

Phase order for the future B2B product: data dictionary -> sample import -> quality checks -> normalized schema -> search API -> saved views and alerts -> partner workflows -> commercial controls.

## Phases

1. **Foundation**: admin shell, roles, settings tables, revision model and audit events.
2. **Content control**: structured pages, preview, approval, rollback and SEO fields.
3. **Media and events**: object storage, gallery, event calendar and rights metadata.
4. **Corporate experience**: improve locations, stories, sector pages and conversion paths.
5. **Trade intelligence**: dataset profiling, ingestion, normalized facts and read-only analytics API.
6. **B2B workflows**: accounts, partner discovery, saved searches, alerts, enquiries and later transactions.

## Current gaps

- The public Site is still a static production artifact; it cannot safely provide authenticated persistent admin control by itself.
- The sandbox admin is a local-draft prototype until the backend contracts and storage are implemented.
- The sandbox build has four unrelated pre-existing TypeScript errors that must be repaired before a clean production build.
- Real company copy, leadership, office addresses, legal policies, event data and approved media still need business-owner confirmation.
