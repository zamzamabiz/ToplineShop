# ERP64 Commodity Marketplace Strategic Execution Plan

Version: 1.0
Status: owner-approved planning baseline, 2026-09-12

## Executive Direction

ERP64 will begin with a Pakistan-focused, invite-only managed marketplace for international agricultural commodities. Sellers publish supply offers, buyers publish bids or demand, the system matches compatible opportunities, and TLS agents qualify and facilitate the deal. The supplier and buyer remain the contracting parties; TLS earns an agreed brokerage, facilitation, or success fee.

The initial commodity scope is rice, wheat, lentils, chickpeas, peas, corn, soybean meal, and selected oilseeds. Edible oils, spices, and wider commodity categories follow only after the first operating corridor is proven.

The first supply research corridor covers Canada, the USA, Australia, India, Pakistan, and additional origins selected by product and buyer demand. The initial demand network is Pakistan-focused and built from invited, previously active importers, exporters, traders, processors, mills, and distributors.

## Business Principles

- Start as a controlled private trade desk, then expand to an approved online marketplace.
- Prefer counterparties with previous trade history, but do not treat familiarity as proof of current solvency or performance.
- Use public and licensed data, official registries, customs evidence, inspection records, trade references, and consent-based intelligence with a recorded evidence grade.
- Keep counterparties masked until TLS has a legitimate reason and both sides consent to disclosure.
- Let the system discover and organize matches; authorized humans approve commercial, quality, compliance, payment, and contract decisions.
- Keep payment directly between the parties and their banks during the pilot.
- Never represent an indicative price, uploaded document, or algorithmic score as a guaranteed transaction.
- Preserve source, version, timestamp, lineage, and decision evidence for every material claim.

## Product Model

The portal has two equal primary actions:

- **Sell Offer:** a seller publishes a genuine lot or supply position.
- **Buy Bid:** a buyer publishes a genuine requirement or demand position.

The workflow is:

`Sell Offer + Buy Bid -> hard-rule screening -> compatibility score -> TLS lead -> agent qualification -> counterparty consent -> quotation -> contract -> inspection/documents -> shipment -> bank/payment status -> settlement -> closure`

The platform supports both:

- **Direct offer negotiation:** seller responds to a buyer bid.
- **RFQ competition:** one buyer invites controlled responses from several qualified sellers.

## Initial Trade Deal Example

The platform must represent a deal such as:

- Wheat, lot A-110, Canada origin
- 500 metric tons with a contract-defined +/- 10% tolerance
- USD 300 per metric ton, nominal value USD 150,000 before tolerance and adjustments
- CFR Karachi Port, Incoterms 2020, with the actual named port and responsibilities recorded
- Shipment during September-October 2026 at seller's option, subject to defined nomination and latest-shipment rules
- CAD/D/P or another agreed bank process, not a TLS payment guarantee
- Seller-issued contract signed and stamped by both parties
- Contract-specific quality, weight, inspection, sampling, fumigation, phytosanitary, origin, bill of lading, invoice, packing, and bank documents

This is a structured commercial record. It is not a complete legal contract until the parties execute the applicable contract and addenda.

## Standards Architecture

The module uses a layered control model:

1. Applicable law and destination-country requirements
2. Contract family and incorporated rules
3. Incoterm and delivery responsibilities
4. Commodity quality and sampling annex
5. Inspection, laboratory, and certification instructions
6. Payment and bank-document instructions
7. TLS workflow, consent, audit, and escalation controls

GAFTA is the preferred contract and technical reference for applicable grains, feed, and pulse trades. FOSFA is the preferred reference for applicable oils, oilseeds, fats, and related products. ICC Incoterms allocate delivery responsibilities, cost, and risk; UCP 600 and URC 522 govern bank documentary practices when incorporated. Codex and destination-country rules govern food/feed safety and regulatory limits. SGS, Cotecna, Intertek, government bodies, and other approved providers perform services according to the contract and their agreed scope.

No provider's logo or uploaded certificate is itself a guarantee. The system records who issued it, for which lot, under what scope, using which method, and whether the destination rule accepts it.

## Partner and Privacy Model

Public users see only masked commodity and market information. Registered users see controlled commercial summaries. Matched counterparties receive identity and documents only after TLS approval and appropriate consent. TLS internal staff see the full evidence trail.

Each partner has separate statuses for identity verification, trade-history verification, quality capability, compliance clearance, credit review, and transaction approval. A trusted past relationship improves prioritization but never bypasses current checks.

## Risk Position

During the pilot, TLS will not:

- Guarantee a buyer's payment
- Guarantee a seller's performance
- Finance deferred payment
- Hold customer money
- Release bank-controlled documents
- Certify commodity quality itself unless properly qualified and authorized
- Publish a reliability score without evidence and governance

TLS may stop, suspend, or reject a deal for identity, sanctions, source, quality, document, payment, country, logistics, legal, or reputational risk.

## #FDD and #123

Every module stage follows #FDD:

`DISCUSS -> DESIGN -> VISUAL PROOF -> OWNER APPROVAL -> FRONTEND FREEZE -> BACKEND/REFINERY -> INTEGRATION -> PERFORMANCE -> AUDIT -> CLOSE`

Every work item follows #123:

`DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT`

The first implementation may use fixtures and mock records based on approved examples. It must not expose real partner data or load millions of trade rows into the browser.

## Success Measures

The pilot succeeds when TLS can repeatedly identify genuine supply-demand matches, qualify both parties, obtain explicit consent, complete a documented contract workflow, track inspection and shipment milestones, record bank/payment status, and produce an auditable result without TLS taking unapproved financial exposure.

Commercial expansion requires evidence of repeat transactions, acceptable claims and payment performance, reliable partners, documented support, lawful data use, and an approved production risk policy.
