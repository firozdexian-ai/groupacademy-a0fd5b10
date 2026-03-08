
-- Add talent_id column to feed_posts for user-generated posts
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS talent_id uuid REFERENCES public.talents(id) ON DELETE SET NULL;

-- Add status column for moderation (admin posts auto-published, user posts need review)
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected'));

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_talent_id ON public.feed_posts(talent_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_status ON public.feed_posts(status);

-- RLS: Allow authenticated users to insert their own posts
CREATE POLICY "Users can create own posts"
ON public.feed_posts
FOR INSERT
TO authenticated
WITH CHECK (
  talent_id IS NOT NULL
  AND talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- RLS: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.feed_posts
FOR UPDATE
TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
)
WITH CHECK (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);

-- RLS: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.feed_posts
FOR DELETE
TO authenticated
USING (
  talent_id IN (SELECT id FROM public.talents WHERE user_id = auth.uid())
);
