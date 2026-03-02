
# Sales & Distribution -- Complete Curriculum Build-Out

## Current State
- **Program ID**: `cd947727-350e-4fd3-813b-0034d4cf208e`
- **Existing**: 3 Foundation courses with 12 modules already populated
- **AI Instructor**: Sarah Rahman (already active)
- **Missing**: 2 more Foundation courses + 5 Intermediate + 4 Executive courses

## New Courses to Add

### Foundation Level (2 additional courses, total becomes 5)

4. **Negotiation & Closing Techniques** (4 modules)
   - Understanding Buyer Psychology in Bangladesh Markets
   - Objection Handling Frameworks for B2B and B2C
   - Closing Strategies: From Trial Close to Final Agreement
   - Post-Sale Follow-Up and Relationship Building

5. **Introduction to Trade Marketing** (4 modules)
   - What is Trade Marketing vs Consumer Marketing
   - Point-of-Sale Materials & In-Store Promotions
   - Trade Schemes, Discounts & Incentive Structures
   - Measuring Trade Promotion Effectiveness (ROI)

### Intermediate Level (5 courses)

1. **Advanced Distribution Network Design** (5 modules)
   - Mapping Distribution Tiers: Super Stockist, Distributor, Sub-Distributor, Retailer
   - Urban vs Rural Distribution Strategy in Bangladesh
   - Warehouse & Hub Location Planning
   - Last-Mile Delivery Challenges & Solutions
   - Distribution Cost Analysis & Margin Optimization

2. **Key Account Management** (4 modules)
   - Identifying and Segmenting Key Accounts
   - Building Strategic Account Plans
   - Joint Business Planning with Retailers & Distributors
   - Managing Multi-Stakeholder Relationships

3. **Sales Team Leadership & Coaching** (5 modules)
   - Recruiting and Onboarding Sales Executives
   - Setting Targets: Top-Down vs Bottom-Up Approaches
   - Field Coaching: Structured Market Visits with Your Team
   - Motivating Sales Teams: Incentives, Recognition & Culture
   - Handling Underperformance: PIPs and Difficult Conversations

4. **Modern Trade & E-Commerce Sales** (4 modules)
   - Understanding Modern Trade Formats (Supermarkets, Chain Stores) in Bangladesh
   - Category Management & Planogram Negotiation
   - E-Commerce Channel Strategy: Marketplace vs D2C
   - Omnichannel Sales Integration & Fulfillment

5. **Sales Analytics & Forecasting** (5 modules)
   - Building Sales Dashboards: Key Metrics That Matter
   - Demand Forecasting Methods: Moving Average, Regression, Judgmental
   - SKU-Level Analysis & Product Portfolio Optimization
   - Territory Performance Benchmarking & Gap Analysis
   - Using Data to Drive Route-to-Market Decisions

### Executive Level (4 courses)

1. **Strategic Sales Management** (4 modules)
   - Designing Go-to-Market Strategy for New Products
   - Sales Organization Design: Geography vs Product vs Channel
   - Revenue Growth Frameworks: Ansoff Matrix in Sales Context
   - Sales Budget Planning & P&L Ownership

2. **National Distribution & Expansion Strategy** (5 modules)
   - Assessing Market Potential Across Bangladesh Divisions
   - Distributor Appointment, Evaluation & Termination
   - Building a National Coverage Model: Numeric & Weighted Distribution
   - Channel Conflict Resolution & Multi-Channel Governance
   - Scaling Distribution for New Categories (FMCG, Pharma, Consumer Electronics)

3. **Trade & Shopper Marketing Strategy** (4 modules)
   - Shopper Behavior Research & In-Store Decision Making
   - Designing Annual Trade Marketing Calendars
   - Category Captainship & Retailer Partnership Models
   - Measuring ROI on Trade Spend & Below-the-Line Activities

4. **Sales Leadership & Business Development** (4 modules)
   - Building a Sales Culture: Vision, Values & Accountability
   - Cross-Functional Leadership: Sales + Marketing + Supply Chain Alignment
   - Developing New Business Channels & Strategic Partnerships
   - Future of Sales: AI Tools, CRM Automation & Data-Driven Selling

## Technical Details

### Database Operations
- **Delete**: 0 records (keep all existing Foundation courses and modules)
- **Insert**: 16 new courses into `content` table with correct `profession_line_id` and `profession_level_id`
- **Insert**: ~62 new modules into `course_modules` with talking-point descriptions
- All courses: `content_type = 'recorded_course'`, `is_published = true`

### Level IDs
- Foundation: `9578ed0c-dfc6-4e62-a1b6-0a96161cc4fe`
- Intermediate: `7e997803-47f3-423e-9790-da9612328cf5`
- Executive: `b7976d18-957b-4dc4-8a95-bbfd44877225`

### No Code Changes Needed
- The existing pages dynamically load courses from the database
- Sarah Rahman (AI Instructor) will automatically pick up all new modules via the enhanced knowledge base loader we just built
