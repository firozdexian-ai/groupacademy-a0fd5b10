

# Academy Schools & Programs -- Complete Structure + UI Redesign

## Suggested Academy Structure

### Executive Academy (for graduates and corporate professionals)
| School | Programs (Professions) |
|--------|----------------------|
| School of Business | Sales & Distribution, Banking & Finance, Sales & Marketing, Operations & Supply Chain, Healthcare & Pharma |
| School of Technology | Technology & IT, Data Science & Analytics, Cybersecurity, Cloud & DevOps |
| School of Creative & Arts | Graphic Design, Content Writing, Video Production, UX/UI Design |
| School of Leadership & HR | Human Resources, Project Management, Executive Leadership, Organizational Development |
| School of Finance & Accounting | Financial Analysis, Auditing & Compliance, Tax & Advisory, Investment Management |

### Freelancing Academy (gig economy and platform skills)
| School | Programs (Professions) |
|--------|----------------------|
| School of Digital Freelancing | Virtual Assistance, Data Entry & Research, Transcription & Translation, SEO & Digital Marketing |
| School of Creative Services | Logo & Brand Design, Social Media Management, Copywriting & Blogging, Photography & Editing |
| School of Technical Services | Web Development, Mobile App Development, WordPress & CMS, API & Automation |
| School of Media & Production | Video Editing, Motion Graphics, Voiceover & Podcasting, Animation |
| School of Consulting | Business Consulting, Career Coaching, Financial Advisory, Marketing Strategy |

### Entrepreneurship Academy (business builders)
| School | Programs (Professions) |
|--------|----------------------|
| School of Startup & Venture | Idea Validation & MVP, Fundraising & Pitching, Product-Market Fit, Scaling & Growth |
| School of E-Commerce | Dropshipping & Fulfillment, Amazon & Marketplace Selling, Shopify Store Management, Digital Products & SaaS |
| School of Social Enterprise | Impact Business Design, NGO Management, Community Development, Sustainable Business |
| School of Small Business | Restaurant & Food Business, Retail & Wholesale, Service-Based Business, Import & Export |

## UI Changes

### 1. Academy tabs now show only school cards (not profession cards)

When user selects an academy tab (Executive, Freelancing, Entrepreneurship), they see a clean grid of school cards -- each showing the school name, description, and a "View Programs" button. No profession cards visible at this level.

### 2. School detail view (inline or navigated)

When a user clicks a school card, they navigate to a school detail page showing all programs (profession categories) within that school, each with a card that links to the profession detail page.

### 3. Rename levels to Level 1, Level 2, Level 3

In `AppProfessionDetail.tsx`, rename the tabs from "Foundation / Intermediate / Executive" to "Level 1 / Level 2 / Level 3".

## Technical Details

### Database Changes

**Insert new schools under Freelancing Academy:**
```sql
INSERT INTO schools (name, slug, academy_id, description, display_order, is_active)
VALUES 
  ('School of Digital Freelancing', 'school-of-digital-freelancing',
   (SELECT id FROM academies WHERE slug = 'freelancing-academy'),
   'Master in-demand digital skills for remote freelancing platforms.', 1, true),
  ('School of Creative Services', 'school-of-creative-services',
   (SELECT id FROM academies WHERE slug = 'freelancing-academy'),
   'Design, write, and create for clients worldwide.', 2, true),
  ('School of Technical Services', 'school-of-technical-services',
   (SELECT id FROM academies WHERE slug = 'freelancing-academy'),
   'Build websites, apps, and technical solutions as a freelancer.', 3, true),
  ('School of Media & Production', 'school-of-media-production',
   (SELECT id FROM academies WHERE slug = 'freelancing-academy'),
   'Video, audio, and motion graphics services.', 4, true),
  ('School of Consulting', 'school-of-consulting',
   (SELECT id FROM academies WHERE slug = 'freelancing-academy'),
   'Offer expert advisory and coaching services.', 5, true);
```

**Insert new school for Executive Academy:**
```sql
INSERT INTO schools (name, slug, academy_id, description, display_order, is_active)
VALUES 
  ('School of Finance & Accounting', 'school-of-finance-accounting',
   (SELECT id FROM academies WHERE slug = 'executive-academy'),
   'Financial analysis, auditing, tax advisory, and investment management.', 5, true);
```

**Insert new school for Entrepreneurship Academy:**
```sql
INSERT INTO schools (name, slug, academy_id, description, display_order, is_active)
VALUES 
  ('School of Small Business', 'school-of-small-business',
   (SELECT id FROM academies WHERE slug = 'entrepreneurship-academy'),
   'Start and run everyday businesses from retail to food services.', 4, true);
```

**Insert new profession categories (programs) for all new schools** -- each program as a `profession_categories` row with the correct `school_id`. Programs for existing schools (like School of Technology) that are missing will also be added.

### File: `src/components/learning/TracksTab.tsx`

**Change `renderAcademy`** to show only school cards (remove the nested profession cards loop):
- Each school rendered as a compact card with name, description, and "View Programs" button
- Clicking navigates to `/app/learning/tracks/school/{school-slug}`

### New Route + Page: School Detail

**File: `src/pages/app/SchoolDetail.tsx`** (new)
- Fetches school by slug, its parent academy, and all profession_categories under it
- Displays school name, academy badge, description
- Grid of profession cards (same design currently in TracksTab's `renderAcademy`)
- Back button to return to tracks

**File: `src/lib/routes.ts`** and **`src/App.tsx`**
- Add route `/app/learning/tracks/school/:slug` pointing to SchoolDetail

### File: `src/pages/app/AppProfessionDetail.tsx`

**Rename level tabs** (lines 246-255):
- "Foundation" becomes "Level 1"
- "Intermediate" becomes "Level 2"  
- "Executive" becomes "Level 3"
- Update the TabsTrigger labels and the fallback text in empty states

### No new dependencies needed

