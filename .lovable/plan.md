
# Flashcard Case-Sensitivity Fix

## Problem Identified

Your flashcard JSON uses **capitalized keys**:
```json
{ "Question": "...", "Answer": "..." }
```

But the flashcard normalizer in `PracticeStage.tsx` only checks for **lowercase keys**:
```typescript
const front = String(c.front || c.question || c.term || c.q || '');
const back = String(c.back || c.answer || c.definition || c.a || '');
```

Since JavaScript is case-sensitive, `c.question` does NOT match `"Question"`. This causes all cards to parse as empty, and then get filtered out. The flashcards "disappear" because they all fail validation.

---

## Solution

Update the `normalizeCard` function in `PracticeStage.tsx` to check for **both capitalized and lowercase variations**:

```typescript
const normalizeCard = (card: unknown, index: number): Flashcard | null => {
  if (!card || typeof card !== 'object') return null;
  const c = card as Record<string, unknown>;
  
  // Check multiple case variations
  const front = String(
    c.front || c.Front || 
    c.question || c.Question || 
    c.term || c.Term || 
    c.q || c.Q || ''
  );
  const back = String(
    c.back || c.Back || 
    c.answer || c.Answer || 
    c.definition || c.Definition || 
    c.a || c.A || ''
  );
  
  if (!front && !back) return null;
  
  return {
    id: String(c.id || c.Id || c.ID || `card-${index}`),
    front,
    back,
    hint: c.hint || c.Hint ? String(c.hint || c.Hint) : undefined,
  };
};
```

---

## Also Update the Admin Import

Update `FlashcardEditor.tsx` import function to handle capitalized keys:

```typescript
const newCards: Flashcard[] = parsed.map((item: any) => ({
  id: crypto.randomUUID(),
  front: item.front || item.Front || item.question || item.Question || "",
  back: item.back || item.Back || item.answer || item.Answer || "",
}));
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/player/stages/PracticeStage.tsx` | Add case variations to normalizeCard function |
| `src/components/dashboard/FlashcardEditor.tsx` | Add case variations to import function |

---

## Expected Outcome

After this fix, your flashcard JSON will work regardless of whether you use:
- `{ "Question": "...", "Answer": "..." }` (capitalized - AI output format)
- `{ "question": "...", "answer": "..." }` (lowercase)
- `{ "front": "...", "back": "..." }` (our standard format)
- `{ "Front": "...", "Back": "..." }` (capitalized)
- `{ "term": "...", "definition": "..." }` (vocabulary format)

All formats will be normalized correctly, and your 54 flashcards will display properly.
