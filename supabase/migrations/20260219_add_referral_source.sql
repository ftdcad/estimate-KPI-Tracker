-- Add referral source fields to estimates table
-- Date: 2026-02-19

ALTER TABLE estimates ADD COLUMN referral_source text DEFAULT '';
ALTER TABLE estimates ADD COLUMN referral_source_rep text DEFAULT '';

CREATE INDEX idx_estimates_referral_source ON estimates(referral_source)
  WHERE referral_source != '';
