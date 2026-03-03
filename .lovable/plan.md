

# School of Business — Global Update (5 Programs)

The School of Business (`0b2f361f`) in the Executive Academy already has all 5 programs built with 14 courses each, but they were created with **Bangladesh-specific** instructor personas and are missing career outcomes (4 of 5). This is a **fix-up pass**, not a full rebuild.

## Current State

| Program | Instructor | Issue | Career Outcome |
|---|---|---|---|
| Banking & Finance | Farhan Ahmed | Bangladesh-specific | Missing |
| Sales & Distribution | Sarah Rahman | Bangladesh-specific | Set (but narrow) |
| Marketing & Brand Management | Nadia Chowdhury | Bangladesh-specific | Missing |
| Operations & Supply Chain | Rafiq Hasan | Bangladesh-specific | Missing |
| Healthcare & Pharma | Dr. Fahmida Akter | Bangladesh-specific | Missing |

**No courses or modules need to be added or deleted** — only metadata updates.

## Actions

### 1. Update 5 AI Instructor Personas to Global

**Farhan Ahmed** → Global: 18+ years in commercial and investment banking across London, Dubai, and Singapore. Former VP at a multinational bank, CFA charterholder, MBA from London Business School.

**Sarah Rahman** → Global: 15+ years in FMCG and pharma sales strategy across emerging and developed markets. Former Regional Sales Director at a global FMCG company. MBA from INSEAD.

**Nadia Chowdhury** → Global: 15+ years in brand management and digital marketing at leading FMCG, telecom, and fintech companies globally. Former Head of Marketing at a Fortune 500 consumer brand. MSc Marketing from Columbia Business School.

**Rafiq Hasan** → Global: 18+ years in operations, supply chain, and logistics across manufacturing, retail, and e-commerce globally. Former VP of Supply Chain at a multinational logistics company. MSc in Operations Management from MIT.

**Dr. Fahmida Akter** → Global: 16+ years in hospital administration, pharmaceutical regulatory affairs, and clinical operations across the US, UK, and Southeast Asia. Former Director of Operations at a global hospital network. DrPH from Johns Hopkins.

### 2. Set Career Outcomes (4 missing + update 1)

- **Banking & Finance**: Banking Officer, Credit Analyst, Relationship Manager, Branch Manager, Investment Banking Associate, Treasury Analyst
- **Sales & Distribution**: Sales Executive, Area Sales Manager, Distribution Manager, Key Account Manager, Regional Sales Director, Head of Sales
- **Marketing & Brand Management**: Brand Manager, Digital Marketing Manager, Marketing Director, Chief Marketing Officer, Communications Lead, Growth Marketing Manager
- **Operations & Supply Chain**: Operations Analyst, Supply Chain Manager, Logistics Director, Procurement Lead, VP of Operations, Chief Operating Officer
- **Healthcare & Pharma**: Healthcare Administrator, Pharma Sales Manager, Clinical Operations Manager, Regulatory Affairs Specialist, Hospital Operations Director, Head of Healthcare Strategy

### Technical Details
- Updates to `ai_instructors.persona` and `ai_instructors.system_prompt` for 5 rows
- Updates to `profession_categories.career_outcome` for 5 rows
- No course or module changes
- No code changes

