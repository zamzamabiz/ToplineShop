# Monitoring and Audit System

## Operational Dashboard

Track offers, bids, matches, agent response time, consent, quotation, contract, inspection, shipment, document, payment, claim, and closure stages.

## Risk Dashboard

Track open stop events, high-risk deals, deferred exposure, credit limits, country and bank concentration, missing documents, expired certificates, inspection variance, suspicious duplicates, and unresolved disputes.

## Key Performance Indicators

- Qualified match rate
- Match-to-contact rate
- Contact-to-consent rate
- Consent-to-quotation rate
- Quotation-to-contract rate
- Contract-to-shipment rate
- On-time shipment rate
- Document first-pass rate
- Inspection pass rate
- Payment-on-time rate
- Claim rate and resolution time
- Repeat partner rate
- Brokerage revenue per closed deal
- TLS exposure by deal and counterparty

## Required Alerts

- Offer or bid nearing expiry
- No agent action within SLA
- Identity or document mismatch
- Credit or deferred-term limit exceeded
- Shipment window at risk
- Missing bill of lading or certificate
- Payment overdue
- Inspection variance
- Duplicate or suspicious communication
- Counterparty status changed after matching

## Audit Record

Record actor, role, timestamp, source, action, before/after value, approval, reason, evidence link, and next action. Never delete a material decision; supersede it with a reasoned correction.

## Review Cadence

- Daily: active leads and exceptions
- Weekly: pipeline, risk, agents, and stale offers
- Monthly: partner index, claims, payment performance, and source quality
- Quarterly: standards versions, policies, access, data rights, and disaster recovery
- Before release: #FDD evidence, owner approval, security, and rollback review
