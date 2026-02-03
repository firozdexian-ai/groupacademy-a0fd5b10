-- Add actuals tracking columns to ir_monthly_targets
ALTER TABLE ir_monthly_targets 
ADD COLUMN IF NOT EXISTS actual_mrr_usd DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS actual_credits_consumed INTEGER,
ADD COLUMN IF NOT EXISTS total_talents INTEGER,
ADD COLUMN IF NOT EXISTS active_talents INTEGER,
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_actuals JSONB;