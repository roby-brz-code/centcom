# Cycling Wallet Journal Generator

Generate double-entry journal entries and a formatted Excel workbook from a Breeze Polygon USDC cycling wallet export.

## What this skill produces

1. **Settlement Summary** — merchant × month matrix of settled amounts
2. **Monthly Journals** — rolled-up double-entry journals (J1/J4/J5/J5d/J7/REF codes) per month
3. **Unmatched Transactions** — cycling wallet outflows that didn't match settlement records (payout top-ups / refunds), booked as Dr 2041 / Cr 1175

## Required inputs

Ask the user to provide paths to:

1. **Integral export** — Excel file (`.xlsx`) exported from Integral.xyz containing the cycling wallet transaction history. Expected columns: `Date`, `Transaction Hash`, `From`, `To`, `Amount`, `Token`, `Description` (column names may vary — inspect and adapt).
2. **Settlement line items** — CSV export of settlement records. Expected columns: `tx_hash` (or `transaction_hash`), `merchant_name`, `amount`, `currency`, `settlement_date`.
3. **Merchant info** — CSV of known merchant escrow addresses. Expected columns: `merchant_name`, `wallet_address` (or similar). This is optional if you already know the address registry.

If any file is missing, tell the user what it's needed for and ask them to provide it before continuing.

## Known address registry

Hard-code these into the classification logic — they are stable Breeze infrastructure addresses:

```
CYCLING_WALLET   = "0x..." # the wallet being analysed — infer from the Integral export (most-frequent From address on outflows)
DISPERSE_CONTRACT = "0x541e..."  # batch settlement contract — outflows here → J5d (Disperse Settlement)
```

Merchant escrow addresses come from the merchant info CSV (dim_merchant_info). Any outflow To address that appears in that CSV is an escrow address.

Classification priority for **outflows** from the cycling wallet:
1. If `To` == DISPERSE_CONTRACT → **J5d** (Disperse Settlement): Dr 2040 Merchant Funds Payable / Cr 1175 Cycling Wallet
2. If tx_hash is in settlement line items → **J5** (Settlement): Dr 2040 Merchant Funds Payable / Cr 1175 Cycling Wallet. This applies regardless of whether `To` is an escrow address, a direct merchant wallet, or any other address — the settlement report is authoritative.
3. If `To` is in merchant escrow addresses AND tx_hash NOT in settlement line items → **REF** (Refund/Payout Top-up): Dr 2041 Payout Liability / Cr 1175. These are small returns that didn't generate a settlement record — failed payouts or refunds, not merchant settlements.
4. Anything else unclassified → flag for manual review

**Key rule**: the tx_hash join against settlement records is the primary classifier for all escrow outflows. A return to stake is only a REF (reduction in payout liability) if there is no matching settlement record. If it appears in the settlement report, it is a J5 settlement regardless of the destination address type.

Classification for **inflows** to the cycling wallet:
- From escrow addresses → **J4** (Escrow Funding): Dr 1175 Cycling Wallet / Cr 2041 Payout Liability
- From Polygon Treasury (1170) → **J1** (Treasury Transfer): Dr 1175 / Cr 1170
- Fee/gas top-ups, small amounts → **J7** (Fee): Dr 7xxx / Cr 1175

## Account codes

| Code | Account                        | Type      |
|------|-------------------------------|-----------|
| 1170 | Polygon Treasury               | Asset     |
| 1175 | Cycling Wallet                 | Asset     |
| 2040 | Merchant Funds Payable         | Liability |
| 2041 | Payout Liability               | Liability |
| 7xxx | Payment Processing Fees        | Expense   |

## Steps

### Step 1 — Load and inspect files

Read each input file with pandas. Print shape and column names. Normalise column names to lowercase with underscores.

For the Integral export (Excel): detect the cycling wallet address as the address that appears most frequently in the `from` column on outflow rows.

### Step 2 — Build address registry

- Load merchant escrow addresses from the merchant info CSV into a set.
- Load settlement tx hashes into a set.

### Step 3 — Classify each transaction

Apply the classification rules above row by row. Add columns: `journal_code`, `debit_account`, `credit_account`, `classification_note`.

### Step 4 — Monthly rollup journals

Group by `journal_code` × `month` (YYYY-MM). For each group produce one rolled-up journal entry:
- Description, Debit account + amount, Credit account + amount
- Balance check: debits must equal credits

### Step 5 — Settlement summary

For J5 and J5d rows, group by `merchant_name` × `month`. Build a matrix table.

### Step 6 — Unmatched tab

Filter to REF rows. Group by month with subtotals. Include a summary box: total count, total amount, date range, journal entry.

### Step 7 — Write Excel workbook

Use `openpyxl`. Three sheets:
- **Settlement Summary** — merchant × month matrix, styled header row (dark background, white bold text), alternating row shading, currency format, TOTAL row
- **Monthly Journals** — columns: Month, Journal Code, Description, Debit Account, Debit Amount, Credit Account, Credit Amount, Source / Note. Balance-check rows in italic. Header styled same as above.
- **Unmatched Transactions** — columns: Month, Date, Tx Hash, From, To, Amount (USDC), Journal Code, Note. Month subtotal rows. Summary box at top.

Save to a timestamped file: `/tmp/cycling_wallet_journals_YYYYMMDD.xlsx`

### Step 8 — Report

Print a summary:
```
✓ Cycling wallet journals generated
  Period:     YYYY-MM  to  YYYY-MM
  Inflows:    $X,XXX,XXX.xx  (N txns)
  Outflows:   $X,XXX,XXX.xx  (N txns)
  Settlements (J5/J5d):  $X,XXX,XXX.xx  to N merchants
  Unmatched (REF):       $XX,XXX.xx  (N txns)
  Output:     /tmp/cycling_wallet_journals_YYYYMMDD.xlsx
```

Then send the file to the user with SendUserFile.

## Important notes

- All amounts are USDC — treat as USD equivalent, 1:1.
- Never write to QuickBooks or any external system — this is analysis only.
- If tx_hash columns use different capitalisation or prefixing (e.g. `0X` vs `0x`), normalise to lowercase before joining.
- If the Integral export has multiple sheets, look for the one containing transaction rows (usually the first sheet or one named "Transactions").
- Flag any unclassified rows explicitly — do not silently drop them.
- Amounts should always be positive in the workbook; use debit/credit columns to express direction.
