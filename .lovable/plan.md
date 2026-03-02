

# School of Technology: Program Structure Fix

## What We're Doing
Two changes to set up the School of Technology with 5 globally-relevant programs before we start building curricula.

## Change 1: Rename "Technology & IT" to "Software Engineering"
- Update name from "Technology & IT" to "Software Engineering"
- Update slug from "technology-it" to "software-engineering"
- Update icon from "laptop" to "code" (more fitting)
- Program ID: `1e71843c-d202-4d96-834e-04fa6c784f16`

## Change 2: Add "AI & Machine Learning" as a new program
- Insert a new program into `profession_categories`
- Name: AI & Machine Learning
- Slug: ai-machine-learning
- Icon: brain
- School ID: `bc8f17f4-6a5a-4a6d-92ab-52d245d16998` (School of Technology)
- Description: Master artificial intelligence, machine learning, deep learning, NLP, and MLOps to build intelligent systems and drive innovation.
- Career outcome: AI/ML Engineer, Data Scientist (ML), Research Engineer
- Display order: 5

## Final Program Lineup (School of Technology)

| Order | Program | Icon | Status |
|-------|---------|------|--------|
| 2 | Data Science & Analytics | bar-chart-2 | Existing (unchanged) |
| 3 | Software Engineering | code | Renamed from "Technology & IT" |
| 3 | Cybersecurity | shield | Existing (unchanged) |
| 4 | Cloud & DevOps | cloud | Existing (unchanged) |
| 5 | AI & Machine Learning | brain | New |

## Technical Details
- **UPDATE** `profession_categories` for the rename (name, slug, icon)
- **INSERT** 1 new row into `profession_categories` for AI & ML
- **No code changes** needed -- pages load dynamically from the database
- After this, we proceed program-by-program with curriculum + AI instructor build-out

