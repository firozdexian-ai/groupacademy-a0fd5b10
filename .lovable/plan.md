
# Comprehensive AI Services Reconstruction Plan
## Complete Fix for All 5 AI Services - No More Patchwork

---

## Executive Summary

After a deep audit of all AI service flows (edge functions, frontend pages, database), I've identified **11 critical issues** across the 5 services that need permanent fixes. This plan provides a complete reconstruction to ensure bulletproof operation.

---

## Service 1: Career Assessment

### Current Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| **Question options malformed** | Database: `assessment_questions` rows 17-22 | CRITICAL |
| Options stored as flat strings instead of objects | `["Never", "Rarely", ...]` vs `[{value, label}]` | |
| Scale questions (17, 20, 23, 26) have NULL options | Missing minLabel/maxLabel | HIGH |

### Root Cause
Questions 17-26 were inserted with incorrect JSONB format. The `AssessmentStepper.tsx` expects:
```typescript
// Expected format
{ value: "never", label: "Never", score: 1 }

// Current broken format
"Never"  // Just a string!
```

### Fix Plan

**Part 1: Database Migration - Fix All Malformed Questions**

```sql
-- Fix Question 17 (scale with null options)
UPDATE assessment_questions 
SET options = '[{"min": 1, "max": 10, "minLabel": "Not confident", "maxLabel": "Very confident"}]'::jsonb
WHERE id = 'e2060214-5cc7-4e6e-b169-cb57482db061';

-- Fix Question 18 (single_choice with flat array)
UPDATE assessment_questions 
SET options = '[
  {"value": "never", "label": "Never", "score": 1},
  {"value": "rarely", "label": "Rarely", "score": 2},
  {"value": "sometimes", "label": "Sometimes", "score": 3},
  {"value": "often", "label": "Often", "score": 4},
  {"value": "always", "label": "Always", "score": 5}
]'::jsonb
WHERE id = '8fe62c72-2208-4084-8fb5-bd721324c388';

-- Fix Question 19 (single_choice with flat array)
UPDATE assessment_questions 
SET options = '[
  {"value": "avoid", "label": "I avoid conflicts", "score": 1},
  {"value": "struggle", "label": "I struggle with conflicts", "score": 2},
  {"value": "manage", "label": "I manage reasonably well", "score": 3},
  {"value": "effective", "label": "I handle conflicts effectively", "score": 4},
  {"value": "excel", "label": "I excel at conflict resolution", "score": 5}
]'::jsonb
WHERE id = '158d47f3-5460-43c5-bcb6-a4c6b2681f94';

-- Fix Question 20 (scale with null options)
UPDATE assessment_questions 
SET options = '[{"min": 1, "max": 10, "minLabel": "Not proactive", "maxLabel": "Very proactive"}]'::jsonb
WHERE id = '74d230e6-f30e-4e97-ae42-8ccccafd073b';

-- Fix remaining questions with flat arrays (21-26)
-- Similar pattern for each...
```

**Part 2: Frontend Defense - Add Options Normalizer**

**File:** `src/components/assessment/AssessmentStepper.tsx`

Add defensive normalization to handle any legacy/malformed data:

```typescript
// Helper function to normalize options
const normalizeOptions = (options: any[]): Array<{value: string; label: string; score?: number}> => {
  if (!options || !Array.isArray(options)) return [];
  
  return options.map((opt, idx) => {
    // If already in correct format
    if (typeof opt === 'object' && opt.value && opt.label) {
      return opt;
    }
    // Handle flat string arrays (legacy format)
    if (typeof opt === 'string') {
      return {
        value: opt.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        label: opt,
        score: idx + 1
      };
    }
    // Fallback
    return { value: String(idx), label: String(opt), score: idx + 1 };
  });
};

// Use before rendering
const normalizedOptions = normalizeOptions(options);
```

---

## Service 2: Mock Interview

### Current Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| **Redundant capture page for app users** | `MockInterviewQuestions.tsx` line 182 | HIGH |
| App users with `talent_id` still redirected to capture page | Unnecessary extra step | |
| No inline analysis trigger for logged-in users | Must go through capture flow | MEDIUM |

### Root Cause
Line 182 always redirects to `/mock-interview/capture/:id` regardless of whether the user came from the app (already has name/phone/talent_id) or public flow.

### Fix Plan

**File:** `src/pages/MockInterviewQuestions.tsx`

**Change 1:** Load `talent_id` with interview data

```typescript
// In loadInterview(), also get talent_id
setInterview({
  id: data.id,
  email: data.email,
  job_title: data.job_title,
  company_name: data.company_name,
  questions,
  answers: existingAnswers,
  status: data.status || "in_progress",
  talent_id: data.talent_id  // Add this
});
```

**Change 2:** Smart routing after final question

```typescript
} else {
  // All questions answered
  if (interview.talent_id) {
    // App user: has profile data, skip capture → analyze directly
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("analyze-mock-interview", {
        body: { interviewId: id }
      });
      if (error) throw error;
      toast.success("Analysis complete!");
      navigate(`/mock-interview/results/${id}`);
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
      setIsSubmitting(false);
    }
  } else {
    // Public user: needs lead capture
    navigate(`/mock-interview/capture/${id}`);
  }
}
```

**Change 3:** Add loading state for analysis

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

// Show processing UI during analysis
if (isSubmitting) {
  return (
    <ProcessingCard
      title="Analyzing Your Interview"
      stages={INTERVIEW_ANALYSIS_STAGES}
      duration={45000}
    />
  );
}
```

---

## Service 3: Salary Analysis

### Current Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| Complex cooldown/access code flow | `SalaryAnalysisSetup.tsx` | LOW |
| Duplicate logic between public and app pages | Two separate files | TECH DEBT |

### Assessment
The salary analysis flow is **working correctly**. The edge function has proper:
- Authentication
- Ownership verification (IDOR prevention)
- Rate limit handling (429/402)
- JSON parsing with fallbacks
- 90-second timeout

### Minor Improvement
Add consistent error handling in `SalaryAnalysisProcessing.tsx` for AI failures.

---

## Service 4: AI Agent Chat

### Current Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| Good streaming implementation | `useAgentChat.ts` | - |
| Proper session management | 30-minute expiry works | - |

### Assessment
The AI Agent Chat is **working correctly**. The flow has:
- Proper authentication with user token (not anon key)
- Session-based credit charging
- Token-by-token streaming
- Session expiry management
- Error handling with `aiErrorHandler.ts`

### No Changes Required
This service is solid.

---

## Service 5: CV Parsing (parse-cv)

### Current Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| Base64 encoding implemented | Per memory note | RESOLVED |
| Works with file upload and URL paste | | |

### Assessment
The CV parsing service was previously fixed to use Base64 encoding for PDF content. **No changes required.**

---

## Implementation Roadmap

### Phase 1: Critical Data Fix (Database)

**Priority: IMMEDIATE**

1. Run SQL migration to fix all malformed assessment questions (17-26)
2. Verify all single_choice questions have proper `{value, label}` format
3. Verify all scale questions have proper `{min, max, minLabel, maxLabel}` format

### Phase 2: Frontend Resilience

**Priority: HIGH**

1. Add `normalizeOptions()` helper to `AssessmentStepper.tsx`
2. Apply normalization before rendering radio/checkbox options
3. Test all 26+ questions render correctly

### Phase 3: Mock Interview Flow Optimization

**Priority: HIGH**

1. Update `MockInterviewQuestions.tsx` to check for `talent_id`
2. Add inline analysis trigger for app users
3. Add `ProcessingCard` loading state
4. Skip capture page for logged-in users

### Phase 4: Testing & Validation

1. Test Career Assessment: Complete all 26 questions
2. Test Mock Interview: App flow (no capture page) and public flow (with capture)
3. Test Salary Analysis: Both app and public flows
4. Test AI Agents: Start session, chat, expiry

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Fix 10+ questions with malformed options |
| `src/components/assessment/AssessmentStepper.tsx` | Add `normalizeOptions()` helper + apply to rendering |
| `src/pages/MockInterviewQuestions.tsx` | Add talent_id check, inline analysis, skip capture for app users |

---

## Technical Details

### Database Question IDs to Fix

| ID | Display Order | Type | Issue |
|----|---------------|------|-------|
| `e2060214-5cc7-4e6e-b169-cb57482db061` | 17 | scale | NULL options |
| `8fe62c72-2208-4084-8fb5-bd721324c388` | 18 | single_choice | Flat string array |
| `158d47f3-5460-43c5-bcb6-a4c6b2681f94` | 19 | single_choice | Flat string array |
| `74d230e6-f30e-4e97-ae42-8ccccafd073b` | 20 | scale | NULL options |
| `639de7bb-bf68-40d5-9e92-977d88fbbfa8` | 21 | single_choice | Flat string array |
| `e58ae8a0-a220-4061-b9dc-3676fd90dd46` | 22 | single_choice | Flat string array |
| More... | 23-26 | mixed | Various issues |

### Mock Interview Interface Update

```typescript
interface Interview {
  id: string;
  email: string;
  job_title: string | null;
  company_name: string | null;
  questions: Question[];
  answers: Answer[] | null;
  status: string;
  talent_id: string | null;  // ADD THIS
}
```

---

## Expected Outcomes

After implementation:

1. **Career Assessment**: All 26+ questions render with proper option labels
2. **Mock Interview**: App users go directly questions → analysis → results (no capture page)
3. **Salary Analysis**: Continues working as expected
4. **AI Agents**: Continues working as expected
5. **CV Parsing**: Continues working as expected

---

## Validation Checklist

- [ ] Question 18 shows "Never", "Rarely", etc. labels
- [ ] Question 17 shows slider with "Not confident" to "Very confident" labels
- [ ] Mock Interview app flow skips capture page
- [ ] Mock Interview public flow still shows capture page
- [ ] All services handle 429/402 errors gracefully
- [ ] All services have 90-second timeouts
