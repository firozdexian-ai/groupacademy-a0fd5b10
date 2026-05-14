CREATE OR REPLACE FUNCTION public.get_ugc_dashboard()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'free_videos',     (SELECT count(*) FROM content WHERE content_type = 'free_video'),
    'blogs',           (SELECT count(*) FROM blog_posts),
    'feed_posts',      (SELECT count(*) FROM feed_posts WHERE is_active IS NOT FALSE),
    'competitions',    (SELECT count(*) FROM competitions),
    'open_reports',    (SELECT count(*) FROM content_reports WHERE status = 'open'),
    'published_blogs', (SELECT count(*) FROM blog_posts WHERE status = 'published'),
    'published_videos',(SELECT count(*) FROM content WHERE content_type='free_video' AND is_published = true),
    'active_comps',    (SELECT count(*) FROM competitions WHERE status = 'active')
  )
$$;

REVOKE ALL ON FUNCTION public.get_ugc_dashboard() FROM public;
GRANT EXECUTE ON FUNCTION public.get_ugc_dashboard() TO authenticated;