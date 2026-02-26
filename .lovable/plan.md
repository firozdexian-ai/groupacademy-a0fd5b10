
# Fix: Render HTML Job Descriptions Properly

## Problem

LinkedIn-imported jobs store rich HTML in `ai_enhanced_description` (with `<p>`, `<b>`, `<ul>`, `<li>` tags). Both job detail pages render this as plain text using `{displayDescription}`, causing raw HTML tags to show on screen (as seen in your screenshot).

## Solution

Use `dangerouslySetInnerHTML` when the description contains HTML tags, and fall back to plain text rendering otherwise. This is a simple conditional check.

## Changes

### 1. `src/pages/app/AppJobDetail.tsx` (line ~481)

Replace:
```jsx
{displayDescription}
```

With a conditional that detects HTML and renders it properly:
```jsx
{isHtml
  ? <div dangerouslySetInnerHTML={{ __html: displayDescription }} />
  : displayDescription}
```

### 2. `src/pages/PublicJobDetail.tsx` (line ~299)

Same fix -- detect HTML and use `dangerouslySetInnerHTML` when present.

### Detection Logic

A simple regex check determines if the content contains HTML:
```typescript
const isHtml = /<[a-z][\s\S]*>/i.test(displayDescription || "");
```

This ensures:
- LinkedIn-imported jobs with HTML descriptions render formatted content (bold, lists, paragraphs)
- Manually entered plain-text descriptions continue to render normally with `whitespace-pre-wrap`
- No changes to existing data or database needed

| File | Change |
|------|--------|
| `src/pages/app/AppJobDetail.tsx` | Conditionally render HTML descriptions |
| `src/pages/PublicJobDetail.tsx` | Same fix |
