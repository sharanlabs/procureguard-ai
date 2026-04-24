# Data Dictionary — ProcureGuard AI

Golden reference for field definitions, exception taxonomy, and 3-way match cross-reference. Every exception is verified against actual field values in the CSV files.

**Severity tiers:** Tier 1 = auto-approve (within tolerance, no human action required) · Tier 2 = review (hold, draft supplier email, queue for AP approval) · Tier 3 = escalate (halt processing, generate escalation memo, requires procurement lead)

---

## Section 1 — Field Definitions

### purchase_orders.csv

| Field Name | Data Type | Description | Example Value | Matching Role |
|---|---|---|---|---|
| po_number | String | Unique PO identifier; format `PO-NNN` | `PO-001` | Primary join key to invoices (`po_reference`) and GRNs (`po_reference`) |
| po_date | Date (YYYY-MM-DD) | Date the PO was issued by the buyer | `2026-03-03` | Establishes the ordering timeline; invoice and GRN dates should follow this date |
| supplier_id | String | Internal supplier master ID; format `SUP-NNN` | `SUP-001` | Cross-check against `invoice.supplier_id`; authoritative identity even if names differ |
| supplier_name | String | Supplier legal or trade name at time of PO | `Apex Industrial` | Cross-check against `invoice.supplier_name`; mismatches trigger E08 |
| item_code | String | SKU / catalog code for the ordered item | `PKG-TAPE-3IN` | Item-level matching key across all three documents |
| item_description | String | Human-readable item name | `Heavy Duty Packing Tape 3-inch` | Cross-check against invoice description; mismatches with same item_code trigger E09 |
| quantity | Integer | Authorized order quantity in PO UOM | `200` | Ceiling benchmark for invoice and GRN quantity; excess triggers E02 or E13 |
| unit_price | Decimal (USD) | Contracted price per single UOM unit | `2.85` | Price benchmark; unexplained invoice deviations trigger E01; tariff-justified deviations trigger E17 |
| uom | String | Unit of measure for quantity and price | `rolls` | Must align with invoice UOM; mismatches trigger E05 |
| total_amount | Decimal (USD) | `quantity × unit_price`; excludes tax unless noted in `payment_terms` | `570.00` | Expected invoice line total before any surcharges or tax |
| warehouse_code | String | Designated receiving warehouse | `BOS1` | Cross-check against `grn.receiving_warehouse` |
| payment_terms | String | Contractual payment terms; may include tax rate or early-pay discount | `Net 30` / `Net 30 (Tax 7%)` / `2/10 Net 30` | Governs payment timing, tax rate, and early-pay discount; tax mismatches trigger E10; absent discount triggers E16 |
| supplier_diversity_cert | String | Diversity certification category; `none` if uncertified | `small_business` | Compliance, spend reporting, and supplier diversity tracking; not a matching field |

---

### invoices.csv

| Field Name | Data Type | Description | Example Value | Matching Role |
|---|---|---|---|---|
| invoice_number | String | Supplier-assigned invoice identifier | `INV-0001` | Must be unique across all invoices; duplicates trigger E07 |
| invoice_date | Date (YYYY-MM-DD) | Date the invoice was issued by the supplier | `2026-03-10` | Must follow the first GRN date (goods before pay); early dates trigger E12 |
| supplier_id | String | Supplier master ID as stated on invoice | `SUP-001` | Match to `po.supplier_id`; authoritative for identity resolution |
| supplier_name | String | Supplier name as stated on invoice | `Apex Industrial` | Cross-check against `po.supplier_name`; legal-name variants trigger E08 |
| po_reference | String | PO number cited by the supplier | `PO-001` | Join key to `purchase_orders.po_number`; non-existent PO numbers trigger E11 |
| item_code | String | SKU on the invoice | `PKG-TAPE-3IN` | Item-level join key to PO and GRN |
| item_description | String | Item name as stated on the invoice | `Heavy Duty Packing Tape 3-inch` | Cross-check against PO description for same `item_code`; mismatches trigger E09 |
| quantity_invoiced | Integer | Quantity the supplier is billing for, in invoice UOM | `200` | Compare to `po.quantity` (excess → E02) and `grn.quantity_received` (excess → E03) |
| unit_price | Decimal (USD) | Price per unit as stated on the invoice | `2.85` | Compare to `po.unit_price`; unexplained difference → E01; tariff-justified difference → E17 |
| uom | String | Unit of measure on the invoice | `rolls` | Must match `po.uom`; conversion cases trigger E05 |
| total_amount | Decimal (USD) | Invoice line total; may include surcharges or tax | `570.00` | Compare to `po.total_amount`; unexplained delta triggers E04 or E10 |
| notes | String | Free-text supplier notes; may explain or reveal discrepancies | `Includes $285.00 freight surcharge…` | Parse for unauthorized charges (E04), UOM conversions (E05), tax rate (E10), discount refusal (E16), tariff justification (E17) |

---

### goods_receipts.csv

| Field Name | Data Type | Description | Example Value | Matching Role |
|---|---|---|---|---|
| grn_number | String | Unique GRN identifier; format `GRN-NNN` | `GRN-001` | Reference ID for audit trail; cited in exception reports |
| grn_date | Date (YYYY-MM-DD) | Date goods were physically received at the warehouse | `2026-03-07` | Must precede or equal `invoice.invoice_date` for clean match; earlier invoice dates trigger E12 |
| po_reference | String | PO number the receipt is booked against | `PO-001` | Join key to `purchase_orders.po_number` |
| item_code | String | SKU of the item physically received | `PKG-TAPE-3IN` | Item-level join to PO and invoice |
| quantity_received | Integer | Physical count of units received, in PO UOM | `200` | Sum across multiple GRNs for same PO; compare to `invoice.quantity_invoiced` |
| receiving_warehouse | String | Warehouse code where goods arrived | `BOS1` | Cross-check against `po.warehouse_code` |
| received_by | String | Name of warehouse staff who accepted delivery | `J. Martinez` | Accountability field for audit; not used in automated matching logic |

---

## Section 2 — Exception Type Catalog

All 17 exception types are verified against actual field values in the CSV files. Two rows carry dual exceptions (INV-0013: E03+E12; INV-0017: E04+E15).

| ID | Exception Name | Definition | Tier | Invoice Row(s) | PO Row(s) | GRN Row(s) | Expected AI Action |
|---|---|---|---|---|---|---|---|
| E01 | Unit Price Variance | `invoice.unit_price` ≠ `po.unit_price`; no tariff or contractual justification in notes | Tier 2 | INV-0016 (+8.0%, no notes) | PO-016 | GRN-018 | Hold invoice; calculate variance % and $ delta; draft supplier query requesting corrected invoice or credit note |
| E02 | Invoice Quantity Exceeds PO | `invoice.quantity_invoiced` > `po.quantity`; billing for more than the authorized order | Tier 3 | INV-0011 (120 billed vs PO=100, GRN=100; **$170.00** overbilled) | PO-011 | GRN-014 | Halt payment; issue debit memo; request credit note for excess 20 units; flag for AP supervisor review |
| E03 | Invoice Quantity Exceeds GRN | `invoice.quantity_invoiced` > total `grn.quantity_received`; billing for goods not yet confirmed received | Tier 2 | INV-0013 (100 invoiced vs 60 received; **$78.00** overbilled) | PO-013 | GRN-016 | Hold payment on unconfirmed 40-unit delta; partial-pay confirmed GRN quantity; request updated GRN or supplier credit |
| E04 | Unauthorized Additional Charge | `invoice.total_amount` > `po.unit_price × invoice.quantity_invoiced`; surcharge not authorized in PO | Tier 2 | INV-0017 (+**$285.00** freight surcharge; total $1,422.50 vs PO $1,137.50) | PO-017 | GRN-019, GRN-020 | Hold disputed $285.00; draft supplier query citing contract; withhold until surcharge is backed by PO amendment or removed |
| E05 | Unit of Measure Mismatch | `invoice.uom` ≠ `po.uom`; quantities require a conversion factor to reconcile | Tier 2 | INV-0018 (PO: 50 cases @ $42.00; invoice: 600 units @ $3.50; totals reconcile at $2,100.00; 1 case = 12 units) | PO-018 | GRN-021 | Verify conversion factor (×12); confirm totals agree; flag for vendor-master UOM update; approve if amounts reconcile after conversion |
| E06 | Missing Goods Receipt | No GRN exists for the referenced PO; physical delivery is unconfirmed | Tier 3 | INV-0014 ($45.00; no GRN found for PO-014) | PO-014 | None | Halt payment; contact warehouse to locate goods or confirm non-delivery; return invoice to supplier pending GRN |
| E07 | Duplicate Invoice Number | Same `invoice.invoice_number` appears on two distinct transactions | Tier 3 | INV-0005 (used for PO-005 on 2026-03-19 **and** PO-021 on 2026-04-25) | PO-005, PO-021 | GRN-007, GRN-024 | Halt second occurrence; alert AP supervisor; require supplier to re-issue with unique number; investigate for duplicate-payment fraud |
| E08 | Supplier Name Mismatch | `invoice.supplier_name` differs from `po.supplier_name` but `supplier_id` is the same | Tier 1 | INV-0020 ("Apex Industrial Supply Co." vs PO "Apex Industrial"; SUP-001 matches) | PO-020 | GRN-023 | Auto-approve; log name discrepancy; trigger vendor-master legal-name update; no payment hold required |
| E09 | Item Description Mismatch | `invoice.item_description` differs from `po.item_description` for the same `item_code` | Tier 1 | INV-0022 ("Industrial Packaging Tape 3in" vs PO "Heavy Duty Packing Tape 3-inch"; item_code PKG-TAPE-3IN matches) | PO-022 | GRN-025 | Auto-approve; flag description discrepancy for catalog master-data update; verify item_code before approving |
| E10 | Tax Rate Mismatch | Invoice applies a different tax rate than the rate specified in `po.payment_terms` | Tier 2 | INV-0023 (8.5% applied vs 7% in PO; $461.13 actual vs $454.75 expected; **$6.38** overbilled) | PO-023 | GRN-026 | Hold $6.38 difference; draft supplier query on applicable regional rate; request corrected invoice or credit note |
| E11 | Invalid PO Reference | `invoice.po_reference` does not match any `po.po_number` in the system | Tier 3 | INV-0024 (PO-099 not found; notes: "Urgent order placed directly with supplier") | PO-099 (absent) | GRN-027 (refs PO-024) | Halt payment; escalate to procurement as maverick spend; require retroactive PO approval or supplier return; log policy violation |
| E12 | Invoice Predates Goods Receipt | `invoice.invoice_date` is earlier than the first `grn.grn_date` for the same PO | Tier 2 | INV-0013 (invoice 2026-04-07; GRN-016 date 2026-04-08 — one day early) | PO-013 | GRN-016 | Hold payment until GRN date confirmed; log timing violation in audit trail; query supplier on early invoicing practice |
| E13 | GRN Quantity Exceeds PO | Total `grn.quantity_received` > `po.quantity`; warehouse accepted an over-shipment | Tier 1 | INV-0015 (GRN-017 = 110 pallets received vs PO-015 = 100; invoice correctly billed at 100) | PO-015 | GRN-017 | Auto-approve invoice at PO quantity (100); flag 10-unit over-receipt for warehouse audit; initiate return or PO amendment for surplus |
| E14 | Short Delivery | Supplier delivered and invoiced less than PO quantity; `invoice.quantity_invoiced` = `grn.quantity_received` < `po.quantity` | Tier 1 | INV-0012 (PO=100, GRN=80, invoice=80; 20-unit shortfall) | PO-012 | GRN-015 | Auto-approve payment for delivered 80 units; open backorder or follow up with supplier on remaining 20; do not penalize |
| E15 | Invoice Covers Undelivered Goods | Invoice issued for a quantity greater than confirmed GRN total at invoice date; final receipt may arrive later | Tier 2 | INV-0017 (invoice 2026-04-16: 30/50 units in GRN-019; remaining 20 in GRN-020 on 2026-04-22) | PO-017 | GRN-019, GRN-020 | Hold payment on undelivered 20-unit portion; approve GRN-confirmed 30 units; release hold automatically on final GRN-020 |
| E16 | Missing Early-Payment Discount | PO `payment_terms` includes an early-pay discount (e.g. `2/10 Net 30`) but invoice notes confirm the discount is not being offered by the supplier | Tier 2 | INV-0019 (PO-019 terms: "2/10 Net 30"; invoice notes: "Standard net-30 payment terms per supplier; 2/10 early-pay discount not offered"; buyer cannot claim **$12.00** discount on $600.00) | PO-019 | GRN-022 | Hold $12.00 (2%) discount amount; draft supplier query citing contractual discount terms; escalate to procurement if supplier refuses |
| E17 | Tariff-Adjusted Price Variance | `invoice.unit_price` > `po.unit_price` and `invoice.notes` cites a government tariff schedule as justification; routes to procurement for PO amendment, not to supplier for correction | Tier 2 | INV-0025 ($2.25 vs PO $1.95; +15.4%; +**$90.00** total; notes: "Price adjusted per 2026 tariff schedule - HS Code 7318.15") | PO-025 | GRN-028 | Hold invoice; route to procurement lead for PO amendment approval (not supplier dispute); verify HS code and tariff rate independently; approve amended PO before releasing payment |

---

## Section 3 — Cross-Reference Map

Golden reference for evals. `INV-0005*` = second use of invoice number INV-0005 (duplicate). Invoice dates for rows 1-10 reflect corrections applied to ensure all clean rows have `invoice_date ≥ final GRN date`.

### Rows 1–10 — Clean Matches

| # | Invoice | Invoice Date | PO | PO Date | GRN(s) | GRN Qty | Match Status |
|---|---|---|---|---|---|---|---|
| 1 | INV-0001 | 2026-03-10 | PO-001 | 2026-03-03 | GRN-001 (200) | 200 | **Clean** |
| 2 | INV-0002 | 2026-03-18 | PO-002 | 2026-03-05 | GRN-002 (25), GRN-003 (25) | 50 | **Clean** — invoice date 2026-03-18 follows GRN-003 (2026-03-17); all 50 units received before invoicing |
| 3 | INV-0003 | 2026-03-14 | PO-003 | 2026-03-07 | GRN-004 (150) | 150 | **Clean** |
| 4 | INV-0004 | 2026-03-28 | PO-004 | 2026-03-10 | GRN-005 (300), GRN-006 (200) | 500 | **Clean** — invoice date 2026-03-28 follows GRN-006 (2026-03-27); all 500 units received before invoicing |
| 5 | INV-0005 | 2026-03-19 | PO-005 | 2026-03-12 | GRN-007 (10,000) | 10,000 | **Clean** — PO has 2/10 Net 30; invoice at full rate is correct; buyer applies discount at payment time |
| 6 | INV-0006 | 2026-03-21 | PO-006 | 2026-03-14 | GRN-008 (300) | 300 | **Clean** |
| 7 | INV-0007 | 2026-03-28 | PO-007 | 2026-03-17 | GRN-009 (3) | 3 | **Clean** — invoice date 2026-03-28 follows GRN-009 (2026-03-27) |
| 8 | INV-0008 | 2026-04-03 | PO-008 | 2026-03-19 | GRN-010 (15), GRN-011 (10) | 25 | **Clean** — invoice date 2026-04-03 follows GRN-011 (2026-04-02); all 25 units received before invoicing |
| 9 | INV-0009 | 2026-03-28 | PO-009 | 2026-03-21 | GRN-012 (30) | 30 | **Clean** |
| 10 | INV-0010 | 2026-04-01 | PO-010 | 2026-03-24 | GRN-013 (400) | 400 | **Clean** |

### Rows 11–25 — Exception Rows (17 distinct types across 15 rows)

| # | Invoice | Invoice Date | PO | PO Date | GRN(s) | GRN Qty | Match Status |
|---|---|---|---|---|---|---|---|
| 11 | INV-0011 | 2026-04-03 | PO-011 | 2026-03-26 | GRN-014 (100) | 100 | **E02 [Tier 3]** — invoiced 120 boxes vs PO=100, GRN=100; overbilled 20 × $8.50 = **$170.00** |
| 12 | INV-0012 | 2026-04-05 | PO-012 | 2026-03-28 | GRN-015 (80) | 80 | **E14 [Tier 1]** — PO=100, invoice=GRN=80; supplier underdelivered; invoice correctly matches delivery; 20-unit shortfall |
| 13 | INV-0013 | 2026-04-07 | PO-013 | 2026-03-31 | GRN-016 (60) | 60 | **E03+E12 [Tier 2]** — invoiced 100 vs 60 received (**$78.00** overbilled vs GRN); invoice date 2026-04-07 is one day before GRN-016 (2026-04-08) |
| 14 | INV-0014 | 2026-04-09 | PO-014 | 2026-04-02 | None | 0 | **E06 [Tier 3]** — no GRN found for PO-014; $45.00 invoice with zero confirmed delivery of Cable Ties |
| 15 | INV-0015 | 2026-04-11 | PO-015 | 2026-04-04 | GRN-017 (110) | 110 | **E13 [Tier 1]** — GRN-017 shows 110 pallets received vs PO=100; invoice correctly at 100; 10-unit over-receipt by warehouse |
| 16 | INV-0016 | 2026-04-14 | PO-016 | 2026-04-07 | GRN-018 (20) | 20 | **E01 [Tier 2]** — unit price $199.80 vs PO $185.00; +$14.80/unit × 20 = **$296.00** overbilled (+8.0%); no tariff or contract note |
| 17 | INV-0017 | 2026-04-16 | PO-017 | 2026-04-09 | GRN-019 (30), GRN-020 (20) | 50 | **E04+E15 [Tier 2]** — $285.00 freight surcharge not in PO (total $1,422.50 vs $1,137.50); at invoice date only 30/50 units received (GRN-020 not until 2026-04-22) |
| 18 | INV-0018 | 2026-04-18 | PO-018 | 2026-04-11 | GRN-021 (50 cases) | 50 cases = 600 units | **E05 [Tier 2]** — PO UOM=cases (50 @ $42.00); invoice UOM=units (600 @ $3.50); totals reconcile at $2,100.00; conversion 1 case = 12 units per invoice notes |
| 19 | INV-0019 | 2026-04-21 | PO-019 | 2026-04-14 | GRN-022 (5,000) | 5,000 | **E16 [Tier 2]** — PO-019 terms "2/10 Net 30"; invoice notes "2/10 early-pay discount not offered"; buyer denied **$12.00** (2% of $600.00) contractual discount |
| 20 | INV-0020 | 2026-04-23 | PO-020 | 2026-04-16 | GRN-023 (300) | 300 | **E08 [Tier 1]** — supplier_name "Apex Industrial Supply Co." vs PO "Apex Industrial"; supplier_id SUP-001 matches; qty/price/UOM clean |
| 21 | INV-0005* | 2026-04-25 | PO-021 | 2026-04-18 | GRN-024 (40) | 40 | **E07 [Tier 3]** — invoice number INV-0005 previously used for PO-005 (2026-03-19); underlying PO-021 qty/price match is clean; duplicate number only |
| 22 | INV-0022 | 2026-04-26 | PO-022 | 2026-04-21 | GRN-025 (200) | 200 | **E09 [Tier 1]** — description "Industrial Packaging Tape 3in" vs PO "Heavy Duty Packing Tape 3-inch"; item_code PKG-TAPE-3IN matches; qty/price clean |
| 23 | INV-0023 | 2026-04-27 | PO-023 | 2026-04-23 | GRN-026 (100) | 100 | **E10 [Tier 2]** — 8.5% tax applied vs 7% in PO payment_terms; $461.13 actual vs $454.75 expected; **$6.38** overbilled |
| 24 | INV-0024 | 2026-04-28 | PO-099 (invalid) | N/A | GRN-027 (refs PO-024, 75 units) | 75 | **E11 [Tier 3]** — PO-099 not in system; notes cite "urgent order placed directly with supplier" — maverick spend; GRN-027 booked against unrelated PO-024 |
| 25 | INV-0025 | 2026-04-29 | PO-025 | 2026-04-22 | GRN-028 (300) | 300 | **E17 [Tier 2]** — unit price $2.25 vs PO $1.95 (+15.4%; +**$90.00** total); notes cite "2026 tariff schedule - HS Code 7318.15"; route to procurement for PO amendment |

---

### Final Verification

| Metric | Count | Detail |
|---|---|---|
| Total invoice rows | **25** | Rows 1-10 + rows 11-25 |
| Clean matches | **10** | Rows 1-10 |
| Exception rows | **15** | Rows 11-25 |
| Distinct exception types | **17** | E01–E17 |
| Tier 1 (auto-approve) exception rows | **4** | INV-0012 (E14), INV-0015 (E13), INV-0020 (E08), INV-0022 (E09) |
| Tier 2 (review) exception rows | **7** | INV-0013 (E03+E12), INV-0016 (E01), INV-0017 (E04+E15), INV-0018 (E05), INV-0019 (E16), INV-0023 (E10), INV-0025 (E17) |
| Tier 3 (escalate) exception rows | **4** | INV-0011 (E02), INV-0014 (E06), INV-0021/INV-0005* (E07), INV-0024 (E11) |
| Rows with dual exceptions | **2** | INV-0013 (E03+E12), INV-0017 (E04+E15) |

> **Note on INV-0021:** Invoice number INV-0021 is absent from the dataset (sequence jumps INV-0020 → INV-0022). Numbering gap in sample data; no matching action required.

> **Note on PO-024:** PO-024 (75 units CONV-ROLL-6, ORD3) has GRN-027 confirmed but no invoice — open receipt awaiting supplier billing. INV-0024 incorrectly references PO-099 (non-existent) for a separate 25-unit transaction by the same supplier (SUP-005).
