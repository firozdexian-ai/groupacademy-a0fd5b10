

## Fix Country Code Not Being Saved During Signup

### Problem Identified

Users from different countries (India, UAE, Pakistan, etc.) are registering, but the admin table shows everyone as "BD" (Bangladesh). 

**Root Cause:** The database trigger that creates talent records is missing the `country` and `country_code` fields.

### What's Working vs What's Broken

| Component | Status |
|-----------|--------|
| PhoneInput component | Working - correctly captures country selection |
| Auth.tsx signup form | Working - passes country/countryCode to signUp |
| useAuth signUp function | Working - stores in auth metadata |
| auth.users.raw_user_meta_data | Working - contains correct country (AE, IN, PK) |
| **Database trigger** | **BROKEN** - doesn't read country fields |
| talents table | Shows incorrect defaults (BD, +880) |

### Evidence from Database

**auth.users table (correct):**
- `rangkesh.k123@gmail.com` → `country: AE`, `country_code: +971`
- `karthikgowda7975355@gmail.com` → `country: IN`, `country_code: +91`
- `muhammadammar001002@gmail.com` → `country: PK`, `country_code: +92`

**talents table (incorrect):**
- All above users show → `country: BD`, `country_code: +880`

---

## Solution

### Part 1: Fix the Database Trigger

Update the `handle_new_user_talent()` function to extract `country` and `country_code` from `raw_user_meta_data`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_talent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.talents (
    user_id,
    email,
    full_name,
    phone,
    country_code,
    country
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+880'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'BD')
  )
  ON CONFLICT (LOWER(email)) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.talents.full_name),
    country_code = COALESCE(NULLIF(EXCLUDED.country_code, ''), public.talents.country_code),
    country = COALESCE(NULLIF(EXCLUDED.country, ''), public.talents.country);
  
  RETURN NEW;
END;
$$;
```

### Part 2: Fix Existing Users (Data Migration)

Run a one-time update to sync existing talent records with their auth metadata:

```sql
UPDATE public.talents t
SET 
  country_code = COALESCE(u.raw_user_meta_data->>'country_code', t.country_code),
  country = COALESCE(u.raw_user_meta_data->>'country', t.country)
FROM auth.users u
WHERE t.user_id = u.id
  AND u.raw_user_meta_data->>'country' IS NOT NULL;
```

---

## Technical Summary

| File/Component | Change |
|----------------|--------|
| Database migration | Update `handle_new_user_talent()` trigger to include `country` and `country_code` fields |
| Database migration | Add data fix to sync existing users |

### Expected Result

After implementation:
1. New signups will correctly save their country information
2. Existing users (India, UAE, Pakistan, etc.) will have their records fixed
3. Admin table will show correct country flags and codes

