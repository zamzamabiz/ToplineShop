# Deal, Offer, and Bid Templates

These are operational field templates. They do not replace a GAFTA, FOSFA, ICC, bank, or lawyer-approved contract.

## Seller Sell-Offer Template

| Field | Required value |
| --- | --- |
| Offer ID / seller ID | Permanent IDs; seller identity masked publicly |
| Commodity / grade / variety | Controlled commodity master and grade reference |
| HS code | Origin code, normalized HS code, classification version |
| Lot reference | Seller lot, crop year, production date, traceability reference |
| Quantity / tolerance | Metric tons and contract-defined tolerance |
| Packing / transport | Bulk, bags, FCL, tanker, vessel, container constraints |
| Origin / loading place | Country, region, approved facility, loading port |
| Destination options | Ports/countries the seller will accept |
| Price | Amount, currency, unit, basis, adjustment formula if any |
| Delivery term | Formal Incoterm and named place |
| Shipment window | Start, end, seller/buyer option, notice deadline |
| Quality | Grade, specification, quality finality, test method |
| Inspection | Provider, location, appointing party, cost, finality |
| Documents | Required documents and presentation route |
| Payment | Advance, LC, CAD/D/P, D/A, open account; seller limits |
| Offer validity | Expiry date/time and revocation rules |
| Consent | Seller confirms authority, truth, availability, and negotiation mandate |

## Buyer Buy-Bid Template

Use the same fields, with buyer-specific requirements:

- Required commodity, grade, origin, quantity, tolerance, and destination
- Target or maximum price and price basis
- Shipment window and acceptable extensions
- Packaging, container, port, and discharge requirements
- Quality, sampling, inspection, and certificate requirements
- Import permits and destination standards
- Preferred and unacceptable payment terms
- Buyer authority, budget/funding evidence, and validity

## Trade Deal Record

Store the complete deal as a versioned record with buyer, seller, broker, agent, contract family/version, commodity annex, quality annex, country pack, payment pack, shipment pack, documents, approvals, messages, amendments, and audit events.

## Contract Pack Checklist

1. Party and authority confirmation
2. Commodity and quality annex
3. Quantity and tolerance clause
4. Price and adjustment clause
5. Incoterm and named place
6. Shipment and nomination clause
7. Inspection, sampling, analysis, and finality
8. Payment and document presentation
9. Insurance and risk allocation
10. Duties, taxes, permits, and sanctions
11. Default, claims, force majeure, and dispute rules
12. Broker fee and commission instruction
13. Signatures, stamps, version, and effective date

## Status Vocabulary

Draft, Submitted, Screening, Published, Matched, Agent Contacted, Consent Pending, Negotiation, Quotation Issued, Contract Pending, Contract Signed, Inspection Pending, Shipment Nominated, Documents Presented, Payment Pending, Shipped, Delivered, Settled, Claimed, Disputed, Cancelled, Rejected, Closed.
