# Matching and Lead Rules

## Matching Contract

The matching engine is a decision-support tool. It creates a lead and explanation; it does not accept an offer, bind a party, approve credit, or guarantee a trade.

## Hard Exclusions

Do not match when product, grade, permitted origin, destination, quantity, shipment window, required certificate, payment method, sanctions status, or party eligibility is incompatible. Do not bypass an expired offer, suspended partner, unresolved claim, or missing mandatory document.

## Normalization

Normalize synonyms, HS-code versions, grades, metric units, currency, dates, ports, Incoterms, shipment windows, packaging, and quality measurements. Preserve every original value and mapping rule for lineage.

## Compatibility Score

Suggested starting weights, subject to pilot calibration:

| Factor | Weight |
| --- | ---: |
| Commodity, grade, and end use | 25 |
| Quantity and tolerance | 15 |
| Price and basis | 15 |
| Origin, destination, and Incoterm | 15 |
| Shipment timing | 10 |
| Quality and certificate fit | 10 |
| Payment compatibility | 5 |
| Verification and history | 5 |

Risk is a separate gate, not a bonus score. A high commercial match cannot override a compliance or payment stop.

## Lead Creation

Every lead stores both source records, match reasons, missing fields, conflicts, score version, evidence grades, assigned agent, next action, due date, and consent status. The agent must confirm the buyer’s genuine demand and seller’s genuine availability before revealing identity or issuing a quotation.

## Privacy

Public results show commodity, broad origin, quantity range, price range, delivery basis, validity, and verification state. Full identities, contact details, exact facilities, and documents are disclosed only on a need-to-know basis after consent and TLS approval.

## Anti-Gaming

Detect duplicate offers, copied documents, impossible prices, repeated cancellations, circular trading, undisclosed related parties, false availability, excessive bid withdrawal, and attempts to move communication outside the controlled workflow.
