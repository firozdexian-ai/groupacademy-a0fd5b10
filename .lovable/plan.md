
# Add AI Instructor for Banking & Finance + Enhanced Knowledge Base

## Overview
Create an AI Instructor for the Banking & Finance program that uses all 62 module descriptions/talking points as its knowledge base. Also enhance the edge function to automatically pull all course and module content for the program, so the AI has full curriculum context in every conversation.

## What Changes

### 1. Database: Insert Banking & Finance AI Instructor
Insert a new record into `ai_instructors` for the Banking & Finance program (`profession_line_id: a1c5d82c-1a1a-4b0e-89e8-19c264a3a915`).

**Instructor persona:**
- **Name**: Farhan Ahmed
- **Persona**: A seasoned banking professional with 18+ years in commercial and investment banking across Bangladesh. Former VP at a leading commercial bank, now dedicated to training the next generation of bankers. Practical, detail-oriented, uses real examples from Bangladesh Bank regulations, local commercial banks (e.g., BRAC Bank, City Bank, Dutch-Bangla Bank), and international banking standards.
- **Expertise areas**: Commercial Banking, Credit Analysis, Trade Finance, Treasury, Risk Management, Basel Framework, Digital Banking, Wealth Management, Corporate Finance, Banking Regulations
- **System prompt**: Comprehensive prompt covering all 14 courses across Foundation/Intermediate/Executive levels, referencing Bangladesh banking context

### 2. Edge Function: Enhance Knowledge Base Loading
Update `supabase/functions/ai-instructor-chat/index.ts` to automatically fetch **all courses and module descriptions** for the instructor's program when a conversation starts. This gives the AI full curriculum knowledge without needing each module to be passed individually.

Current behavior: Only loads the specific course or module context being viewed.

New behavior: Additionally loads a summary of ALL courses and their module talking points for the program, so the AI can reference any part of the curriculum in any conversation.

The enhancement adds a new query that fetches all `content` + `course_modules` for the `profession_line_id` and appends a structured "FULL CURRICULUM KNOWLEDGE BASE" section to the system prompt. This is capped to prevent token overflow (module descriptions truncated if needed).

### 3. No Frontend Changes Needed
The `AIChatPanel` component already passes `professionLineId` to the edge function, and the `DiscussStage` in the course player already renders the chat. The `SchoolDetail` page already shows an indicator when an AI instructor exists.

## Technical Details

### AI Instructor Insert (Database)
```text
Table: ai_instructors
Fields: profession_line_id, name, persona, system_prompt, expertise_areas, is_active
```

### Edge Function Enhancement (ai-instructor-chat/index.ts)
Add after existing instructor fetch (around line 78):

```text
1. Query: SELECT title, description FROM content WHERE profession_line_id = X
2. For each course: SELECT title, description FROM course_modules WHERE content_id = course.id ORDER BY display_order
3. Build "CURRICULUM KNOWLEDGE BASE" section with course titles and module talking points
4. Append to system prompt
```

This ensures the AI instructor can answer questions about any topic across the entire Banking & Finance curriculum, not just the module the learner is currently viewing.

### Repeatable Pattern
This same approach will be used for every future program: insert an AI instructor record + the edge function automatically picks up all curriculum content. No additional code changes needed per program.
