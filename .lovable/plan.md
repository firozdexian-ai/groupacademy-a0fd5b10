

# Add Progress Bar Animation for AI Recommendations

## Problem
When users click "Get AI Recommendations," they only see a small spinner and skeleton cards. The AI processing takes 15-30 seconds, and without feedback on progress, users get frustrated and may think it's stuck.

## Solution
Replace the skeleton loading state with the existing `ProcessingCard` component (already built at `src/components/ui/processing-card.tsx`) which provides a circular percentage indicator, a progress bar, and stage-based messages that update as time passes.

## Changes (single file: `src/pages/app/JobsHub.tsx`)

### 1. Import ProcessingCard
Add import for the `ProcessingCard` component and its `ProcessingStage` type.

### 2. Define processing stages
Create a stages array with meaningful messages mapped to progress percentages:
- 0%: "Analyzing your profile and skills..."
- 20%: "Scanning 2,000+ job listings..."
- 45%: "Matching with job descriptions..."
- 65%: "Ranking best opportunities..."
- 85%: "Preparing your recommendations..."

### 3. Replace the skeleton loading UI
Replace the current loading block (the Brain icon + "Finding your best matches..." text + 3 skeleton cards) with a single `ProcessingCard` component. Set the duration to ~25 seconds to match typical AI processing time.

### 4. Add error handling with retry
Pass the existing error state and retry handler to `ProcessingCard` so users can retry if the request fails, using the built-in error UI of the component.

## Result
Users will see a smooth animated progress bar with a percentage counter and contextual messages explaining what the AI is doing at each stage, reducing frustration during the wait.
