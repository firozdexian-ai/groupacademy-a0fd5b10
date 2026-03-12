

# Update LinkedIn JSON Parser to Support New Leads-Finder Format + Auto-Create Companies/VC Firms

## What Changes

The new crawler uses **snake_case** fields (`first_name`, `linkedin`, `job_title`, `company_name`, `company_website`, `company_linkedin`, `industry`, `city`, `country`, `seniority_level`, `company_size`, `company_description`, `company_founded_year`, etc.) instead of the old camelCase format. It also has richer company data that we can use to auto-create companies and VC firms.

The parser will be updated to **auto-detect** which format is being uploaded (camelCase = old scraper, snake_case = new leads-finder) and handle both seamlessly.

## Key Improvements

1. **Auto-detect format** -- check for `first_name` (new) vs `firstName` (old) on the first record
2. **Richer field mapping** from new format:
   - `city` + `country` directly available (no parsing needed)
   - `job_title` and `headline` both present
   - `seniority_level`, `functional_level` available for talent context
   - `personal_email` as fallback email
   - `company_website`, `company_linkedin`, `company_description`, `company_size`, `industry`, `company_founded_year`, `company_phone`, `company_full_address` -- rich company data
3. **Auto-create companies** during contact import: if `company_name` doesn't match an existing company, create it with enriched data (website, linkedin_url, industry, address, notes from description)
4. **Auto-create VC firms** during investor import: same logic against `ir_vc_firms` (name, website, linkedin_url)
5. **Dedup on LinkedIn URL** in addition to email -- already in place, just needs the new `linkedin` field mapped

## Files to Change

| File | Change |
|------|--------|
| `src/lib/linkedinJsonParser.ts` | Add format detection + new field mappings for all 3 parse functions |
| `src/components/dashboard/LinkedInJsonUpload.tsx` | Add auto-create logic for companies/VC firms during import; update drop zone text |

## Technical Details

**Parser changes** (`linkedinJsonParser.ts`):
- Add new interface `LeadsFinderProfile` with snake_case fields
- Update `getName()` to check `full_name` then `first_name`+`last_name`
- Update `getLinkedInUrl()` to check `linkedin` field
- Update `getPhone()` to check `mobile_number`
- For talents: map `job_title`/`headline` to `custom_profession`, `city`+`country` directly, `keywords` to skills array, `personal_email` as fallback
- For contacts: extract `_companyData` object (name, website, linkedin, industry, address, description) for auto-creation
- For investors: same `_companyData` extraction for VC firm auto-creation

**Upload component changes** (`LinkedInJsonUpload.tsx`):
- During contact import: for unmatched company names, auto-insert into `companies` table using enriched data, then use returned ID for `company_id`
- During investor import: for unmatched firm names, auto-insert into `ir_vc_firms` table
- Dedup companies/VC firms by name (case-insensitive) before creating
- Update description text to say "LinkedIn Profile Scraper or Leads Finder"

