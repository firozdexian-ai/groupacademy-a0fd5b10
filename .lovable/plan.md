

# Batch AI Description Generator for 4,114 Modules

## Scale

19 schools, 4,114 modules need descriptions (< 200 chars). Processing all at once is impractical due to edge function timeouts (60s) and AI rate limits.

## Approach

**Edge function** (`batch-generate-descriptions`) that:
1. Takes a `school_id` and `batch_size` (default 5)
2. Fetches N modules with short descriptions for that school, joining course title + program name
3. Sends ONE AI call with all N modules, asking for structured output (array of {module_id, description})
4. Updates all N modules in the database
5. Returns count processed + count remaining

**Admin UI component** (`BatchDescriptionGenerator`) added to the dashboard:
- Dropdown to select a school (shows remaining count per school)
- "Generate Batch" button that calls the edge function repeatedly with a delay between calls
- Progress bar showing completion percentage
- Auto-pause on rate limit (429) or credit exhaustion (402)
- Stop button to halt processing

## Technical Details

### Edge Function: `supabase/functions/batch-generate-descriptions/index.ts`
- Uses `google/gemini-2.5-flash-lite` (cheapest model — these are simple content generation tasks)
- Processes 5 modules per call to stay well within 60s timeout
- Prompt: Given course title, module title, and program context, generate 200-350 char talking points per module
- Returns structured JSON via tool calling

### Frontend: `src/components/dashboard/BatchDescriptionGenerator.tsx`
- Fetches school list with pending counts
- Runs a loop: call edge function → wait 2s → repeat until school is done or user stops
- Shows real-time progress (processed / total)
- Handles 429/402 gracefully with user-facing messages

### Dashboard Integration
- Add as a new tab or section accessible from admin sidebar
- Or embed within existing content management area

## Execution Order

1. Create edge function `batch-generate-descriptions`
2. Add config.toml entry
3. Create `BatchDescriptionGenerator` component
4. Wire into Dashboard

