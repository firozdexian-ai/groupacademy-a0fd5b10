

# Talent Pool — Final Round: PDF Upload, Deduplication, Source Segmentation & Invitation Flow

## What's Needed

1. **PDF file upload** alongside URL paste in `BatchTalentUpload`
2. **Deduplication guard** — prevent creating duplicate talents (the edge function already checks by email, but the UI should warn upfront)
3. **Source segmentation** — distinguish registered users (`user_id IS NOT NULL`) from admin-uploaded talents
4. **Different welcome/outreach text** for non-registered users — an "invitation to join" message instead of the standard welcome

## Current State

- `BatchTalentUpload` only has a textarea for pasting URLs
- `Talent` interface in `TalentPoolManager` does not include `user_id`
- No storage bucket for CV PDFs exists
- The edge function `batch-parse-cvs` already deduplicates by email (checks if talent exists, skips if parsed within 90 days) — this is solid
- The welcome message in `formatWelcomeWhatsAppLink` assumes the person is already registered

## Plan

### 1. Create `talent-cvs` Storage Bucket (Migration)

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('talent-cvs', 'talent-cvs', true);
-- RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload talent CVs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talent-cvs');
CREATE POLICY "Public can read talent CVs"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'talent-cvs');
```

### 2. Enhance `BatchTalentUpload` — Add File Upload Tab

Add a two-tab layout: **"Paste Links"** | **"Upload Files"**

**Upload Files mode:**
- Multi-file input accepting `.pdf` (max 20 files, 10MB each)
- Upload each file to `talent-cvs` bucket, get the public URL
- Feed those URLs into the same `batch-parse-cvs` edge function
- Show the same progress/error UI

No edge function changes needed — it already works with any URL.

### 3. Add Source Filter + Badge to `TalentPoolManager`

**Interface change:** Add `user_id: string | null` to the `Talent` interface.

**New filter:** Add a `sourceFilter` state (`"all"` / `"registered"` / `"uploaded"`) rendered as a segmented filter row above the table.

**Server-side query:** When `sourceFilter === "registered"`, add `.not("user_id", "is", null)`. When `"uploaded"`, add `.is("user_id", null)`.

**Badge on rows/cards:** Show a small "Registered" (green) or "Uploaded" (orange) badge next to each talent name.

**KPI update:** Add Registered vs Uploaded counts to KPI cards.

### 4. Differentiate Welcome Message for Non-Registered Talents

For talents where `user_id` is null (uploaded, not registered):
- Change the "Send Welcome" action label to **"Send Invite"**
- Use a different message template: an invitation to sign up on the platform with a link

For talents where `user_id` is not null (registered):
- Keep the existing welcome message as-is

### 5. Pre-Upload Deduplication Warning

Before starting a batch upload (URL or file), quickly check the emails that the edge function will encounter. Since we can't know emails before parsing, we add a post-upload summary showing "X skipped (already exists)" — this is already handled by the edge function's skip logic. The UI already displays the skipped count. No additional work needed here.

## Files to Change

| File | Change |
|------|--------|
| **Migration** | Create `talent-cvs` storage bucket + RLS policies |
| `src/components/dashboard/BatchTalentUpload.tsx` | Add tabs for "Paste Links" and "Upload Files", file upload logic to storage bucket |
| `src/components/dashboard/TalentPoolManager.tsx` | Add `user_id` to interface, add `sourceFilter`, source badges, invite vs welcome message differentiation, updated KPI cards |

