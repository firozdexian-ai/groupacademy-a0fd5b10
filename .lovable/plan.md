

# "Apply with AI" -- Pre-Publication Review

## Status: Nearly Complete (1 Critical Fix Needed)

### What's Done (working correctly)
- Database table `external_application_questions` created with correct schema and RLS policy
- Credit pricing configured (`EXTERNAL_APPLICATION` at 50 credits)
- Edge function `prepare-external-application` deployed with dual-path logic (Firecrawl scrape + screenshot fallback)
- Frontend component `ExternalApplicationPrep.tsx` with full UI flow (loading, fallback, results)
- `AppJobDetail.tsx` updated with "Apply with AI" button, credit gate, and dialog integration
- Firecrawl connector linked to project (`FIRECRAWL_API_KEY` available)

### Critical Fix Required

**`supabase/config.toml` is missing the `prepare-external-application` function entry.**

Every other edge function has `verify_jwt = false` in config.toml, but this new function was never added. Without it, Supabase defaults to `verify_jwt = true`, which means the JWT is validated at the gateway level before reaching the function. Since the function already handles auth internally (extracting the token from the Authorization header), this should work -- but to match the project's existing pattern and avoid potential issues, the entry needs to be added:

```toml
[functions.prepare-external-application]
verify_jwt = false
```

### Minor Improvement: Mobile Bottom Bar Duplication

In `AppJobDetail.tsx`, the mobile sticky bottom bar (lines ~660-695) also has an "Apply with AI" button for link-type jobs. This button should also trigger `setShowApplyAI(true)` with a credit check, matching the main button behavior. Currently it does call `handleApply()` which does the right thing, so this is already correct -- no change needed.

### Summary of Changes to Make

| Change | File | Priority |
|--------|------|----------|
| Add `[functions.prepare-external-application] verify_jwt = false` | `supabase/config.toml` | Critical |

One line addition, then the feature is ready to publish.

