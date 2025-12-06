-- Add payment and delivery tracking columns to portfolio_requests
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS payment_reference_url TEXT;
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS delivery_screenshot_url TEXT;
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS delivery_email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.portfolio_requests ADD COLUMN IF NOT EXISTS delivery_email_sent_at TIMESTAMPTZ;