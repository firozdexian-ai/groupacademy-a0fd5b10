

# Wallet: Earned vs Free Credits Breakdown

## Overview

Update the `useCredits` hook to fetch `earned_balance` from `talent_credits`, then show a visual breakdown in the Profile wallet and in the `CreditBalance` full variant.

## Changes

### 1. `src/hooks/useCredits.ts`

- Fetch `earned_balance` alongside `balance` from `talent_credits`
- Expose `earnedBalance` and computed `freeBalance` (balance - earnedBalance) in the return object

### 2. `src/components/credits/CreditBalance.tsx`

- Accept `earnedBalance` from `useCredits`
- In the `full` variant: show a 3-row breakdown (Total, Earned, Free) instead of a single "Credits" line
- Compact and default variants stay unchanged (just show total)

### 3. `src/pages/app/Profile.tsx` (Lines 152-180 -- Credits Card)

- Destructure `earnedBalance` from `useCredits()`
- Below the total balance number, add two small rows:
  - "Earned" with a green accent and the earned amount (withdrawable)
  - "Free" with a blue accent and the free amount (non-withdrawable)
- This sits inside the existing floating credits card, keeping the layout compact

## Technical Details

### useCredits Hook Changes

```
// In fetchBalance:
.select("balance, earned_balance")

// New state:
earnedBalance: number  // from DB
freeBalance: number    // computed: balance - earnedBalance

// Return:
{ balance, earnedBalance, freeBalance, ... }
```

### Profile Wallet Visual

```
 [Coins Icon]  250        [Buy Credits]
               Credits Available
               ----------------------
               Earned: 100 (withdrawable)
               Free:   150
```

### No Database Changes

The `earned_balance` column already exists on `talent_credits` from the Phase 1 migration. The `useCredits` hook just needs to select it.

