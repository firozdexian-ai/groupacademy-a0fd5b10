
-- Tier check constraint
ALTER TABLE public.gtm_countries
  DROP CONSTRAINT IF EXISTS gtm_countries_tier_check;
ALTER TABLE public.gtm_countries
  ADD CONSTRAINT gtm_countries_tier_check
  CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3'));

-- Dashboard RPC
CREATE OR REPLACE FUNCTION public.get_gtm_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_countries jsonb;
  v_unmapped int;
  v_total_regions int;
  v_total_cities int;
  v_total_clusters int;
  v_total_packs int;
BEGIN
  -- per-country rollup
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.name), '[]'::jsonb)
  INTO v_countries
  FROM (
    SELECT
      c.id, c.iso2, c.name, c.tier, c.is_active,
      COALESCE(r.region_count, 0)::int  AS region_count,
      COALESCE(ct.city_count, 0)::int   AS city_count,
      COALESCE(tl.talent_count, 0)::int AS talent_count
    FROM public.gtm_countries c
    LEFT JOIN (
      SELECT country_id, COUNT(*)::int AS region_count
      FROM public.gtm_regions GROUP BY country_id
    ) r ON r.country_id = c.id
    LEFT JOIN (
      SELECT gr.country_id, COUNT(*)::int AS city_count
      FROM public.gtm_cities gc
      JOIN public.gtm_regions gr ON gr.id = gc.region_id
      GROUP BY gr.country_id
    ) ct ON ct.country_id = c.id
    LEFT JOIN (
      SELECT LOWER(TRIM(country)) AS norm, COUNT(*)::int AS talent_count
      FROM public.talents
      WHERE country IS NOT NULL AND TRIM(country) <> ''
      GROUP BY LOWER(TRIM(country))
    ) tl ON tl.norm = LOWER(TRIM(c.name))
  ) t;

  -- unmapped talents (country text doesn't match any gtm_countries.name)
  SELECT COUNT(*)::int INTO v_unmapped
  FROM public.talents tt
  WHERE tt.country IS NOT NULL
    AND TRIM(tt.country) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.gtm_countries gc
      WHERE LOWER(TRIM(gc.name)) = LOWER(TRIM(tt.country))
    );

  SELECT COUNT(*) INTO v_total_regions FROM public.gtm_regions;
  SELECT COUNT(*) INTO v_total_cities FROM public.gtm_cities;
  SELECT COUNT(*) INTO v_total_clusters FROM public.gtm_clusters;
  SELECT COUNT(*) INTO v_total_packs FROM public.country_knowledge_packs;

  RETURN jsonb_build_object(
    'countries', v_countries,
    'unmapped_talent_count', v_unmapped,
    'totals', jsonb_build_object(
      'countries', (SELECT COUNT(*) FROM public.gtm_countries),
      'regions',   v_total_regions,
      'cities',    v_total_cities,
      'clusters',  v_total_clusters,
      'knowledge_packs', v_total_packs
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gtm_dashboard() TO authenticated;
