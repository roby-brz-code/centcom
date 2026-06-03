-- YTD daily revenue and volume (company-wide, aggregate only — no merchant rows).
-- Revenue  = Breeze payin fees + payout fees (overall_revenue metric).
-- Volume   = payin gross settlement + payout gross settlement.
-- base_date is the required partition filter; order_event_date is the reporting date.
SELECT
  order_event_date AS date,
  SUM(payin_converted_order_settlement_fee_amt)
    + SUM(payout_converted_order_settlement_fee_amt)   AS revenue,
  SUM(payin_converted_order_settlement_gross_amt)
    + SUM(payout_converted_order_settlement_gross_amt) AS volume
FROM `beamo-payments-production.product.dma_general_order_financial_metrics_hi`
WHERE base_date >= DATE_TRUNC(CURRENT_DATE(), YEAR)
GROUP BY date
ORDER BY date
