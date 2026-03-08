
-- Marketplace Gigs: employer-posted projects
CREATE TABLE public.marketplace_gigs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_category TEXT NOT NULL, -- aligned with Freelancing Academy schools
  skill_subcategory TEXT, -- aligned with programs within schools
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'bidding')),
  budget_amount INTEGER, -- in credits
  budget_currency TEXT DEFAULT 'credits',
  deadline TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  posted_by UUID REFERENCES auth.users(id),
  employer_name TEXT,
  employer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'in_progress', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  total_bids INTEGER DEFAULT 0,
  selected_bid_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Bids: freelancer proposals
CREATE TABLE public.marketplace_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES public.marketplace_gigs(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.talents(id) ON DELETE CASCADE,
  bid_amount INTEGER NOT NULL, -- in credits
  cover_letter TEXT NOT NULL,
  estimated_days INTEGER,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gig_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_bids ENABLE ROW LEVEL SECURITY;

-- RLS: marketplace_gigs
-- Anyone authenticated can view approved/active gigs
CREATE POLICY "Authenticated users can view active marketplace gigs"
  ON public.marketplace_gigs FOR SELECT TO authenticated
  USING (status IN ('approved', 'active', 'in_progress', 'completed'));

-- Admins can do everything
CREATE POLICY "Admins can manage all marketplace gigs"
  ON public.marketplace_gigs FOR ALL TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- RLS: marketplace_bids
-- Talent can view their own bids
CREATE POLICY "Talent can view own bids"
  ON public.marketplace_bids FOR SELECT TO authenticated
  USING (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Talent can insert their own bids
CREATE POLICY "Talent can create own bids"
  ON public.marketplace_bids FOR INSERT TO authenticated
  WITH CHECK (talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid()));

-- Admins can manage all bids
CREATE POLICY "Admins can manage all bids"
  ON public.marketplace_bids FOR ALL TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_marketplace_gigs_updated_at
  BEFORE UPDATE ON public.marketplace_gigs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_bids_updated_at
  BEFORE UPDATE ON public.marketplace_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
