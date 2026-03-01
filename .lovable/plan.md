

# Add AI Schools to Executive and Freelancing Academies

## What We're Adding

Two new AI-focused schools -- one for each academy -- with distinct orientations:

### 1. School of AI & Strategy (Executive Academy)
Corporate/enterprise AI focus for professionals who need to lead AI initiatives.

**Programs:**
| Program | Description |
|---------|-------------|
| AI Strategy & Governance | Leading AI adoption, ethics, compliance, and organizational AI roadmaps |
| Generative AI for Business | Using ChatGPT, Copilot, and AI tools to boost productivity in corporate settings |
| Data Science & AI Analytics | Machine learning fundamentals, predictive analytics, and data-driven decision making |
| AI Product Management | Building and managing AI-powered products, from ideation to deployment |

### 2. School of AI & Automation (Freelancing Academy)
Practical, hands-on AI skills for earning on freelancing platforms.

**Programs:**
| Program | Description |
|---------|-------------|
| AI Prompt Engineering | Crafting effective prompts for text, image, and code generation -- a top Fiverr skill |
| AI Content & Copywriting | Using AI tools for blog writing, ad copy, social media, and SEO content |
| AI Image & Video Creation | Midjourney, DALL-E, Runway, and other generative media tools for client work |
| AI Chatbot & Automation | Building custom chatbots, workflow automations, and AI integrations for clients |

## Technical Details

### Database: Insert 2 new schools

Insert into `schools` table:
- "School of AI & Strategy" under Executive Academy (display_order 6)
- "School of AI & Automation" under Freelancing Academy (display_order 6)

### Database: Insert 8 new profession categories (programs)

Insert into `profession_categories` table -- 4 programs per school, each with name, slug, description, and school_id.

### No frontend changes needed

The existing TracksTab and SchoolDetail pages already dynamically load schools and programs from the database. The new schools will appear automatically.

### No new dependencies

