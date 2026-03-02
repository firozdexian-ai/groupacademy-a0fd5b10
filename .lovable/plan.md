

# Operations & Supply Chain -- Full Curriculum + AI Instructor

## Step 1: Remove Placeholder Courses
Delete the 2 existing courses (no modules, no enrollments):
- Supply Chain Management Essentials
- Lean Operations & Process Improvement

## Step 2: Insert Full Curriculum (14 courses, ~62 modules)

### Foundation Level (5 courses)

1. **Introduction to Operations Management** (4 modules)
   - What is Operations Management: Scope, Role & Strategic Importance
   - Operations Strategy: Cost, Quality, Speed, Flexibility & Dependability
   - Process Design: Input-Transformation-Output Model
   - Introduction to Capacity Planning & Facility Layout

2. **Supply Chain Fundamentals** (4 modules)
   - Understanding the End-to-End Supply Chain: Suppliers to Customers
   - Key Supply Chain Drivers: Inventory, Transportation, Facilities & Information
   - Supply Chain Flows: Material, Information & Financial
   - Introduction to Supply Chain Mapping & Value Stream Analysis

3. **Inventory & Warehouse Management** (5 modules)
   - Inventory Types: Raw Material, WIP, Finished Goods & MRO
   - Inventory Models: EOQ, Safety Stock & Reorder Point Calculations
   - ABC Analysis & SKU Rationalization
   - Warehouse Operations: Receiving, Putaway, Picking & Shipping
   - Introduction to WMS (Warehouse Management Systems)

4. **Procurement & Sourcing Basics** (4 modules)
   - The Procurement Cycle: From Requisition to Payment
   - Supplier Identification, Evaluation & Selection Criteria
   - Purchase Orders, Contracts & Negotiation Basics
   - Ethical Sourcing & Supplier Diversity in Bangladesh Context

5. **Quality Management Essentials** (4 modules)
   - Introduction to Total Quality Management (TQM) Principles
   - Quality Tools: Pareto, Fishbone, Control Charts & Check Sheets
   - Introduction to ISO 9001 & Quality Management Systems
   - Cost of Quality: Prevention, Appraisal, Internal & External Failure

### Intermediate Level (5 courses)

1. **Production Planning & Control** (5 modules)
   - Master Production Scheduling (MPS) & Material Requirements Planning (MRP)
   - Production Sequencing, Scheduling & Shop Floor Control
   - Demand Forecasting Methods: Qualitative & Quantitative Approaches
   - Sales & Operations Planning (S&OP) Process
   - Managing Production Bottlenecks: Theory of Constraints (TOC)

2. **Lean Operations & Six Sigma** (5 modules)
   - Lean Principles: Value, Value Stream, Flow, Pull & Perfection
   - Key Lean Tools: 5S, Kaizen, Kanban, Poka-Yoke & SMED
   - Six Sigma DMAIC Methodology: Define, Measure, Analyze, Improve, Control
   - Statistical Process Control & Process Capability Analysis
   - Integrating Lean Six Sigma in Bangladesh Manufacturing & Service Industries

3. **Logistics & Transportation Management** (4 modules)
   - Transportation Modes: Road, Rail, Water, Air & Multimodal in Bangladesh
   - Route Optimization & Fleet Management Fundamentals
   - Freight Forwarding, Customs & Trade Documentation
   - Third-Party Logistics (3PL) & Fourth-Party Logistics (4PL) Models

4. **Supply Chain Analytics & Technology** (5 modules)
   - Key Supply Chain KPIs: OTIF, Fill Rate, Inventory Turns, Perfect Order Rate
   - ERP Systems: SAP, Oracle & Local ERP Solutions for Bangladesh
   - Supply Chain Visibility & Control Tower Concepts
   - Introduction to IoT, RFID & Barcode Technologies in Supply Chain
   - Data-Driven Decision Making: Dashboards & Reporting for SC Managers

5. **Strategic Sourcing & Supplier Management** (4 modules)
   - Strategic Sourcing Process: Spend Analysis to Contract Management
   - Supplier Relationship Management (SRM) & Partnership Models
   - Total Cost of Ownership (TCO) Analysis
   - Risk Assessment in Supplier Base: Single Source vs Multi-Source Strategies

### Executive Level (4 courses)

1. **Supply Chain Strategy & Network Design** (5 modules)
   - Supply Chain Strategy Alignment with Corporate Strategy
   - Network Design: Number, Location & Capacity of Facilities
   - Make vs Buy Decisions & Outsourcing Strategy
   - Global Supply Chain Management: Import/Export, Free Trade Zones in Bangladesh
   - Supply Chain Segmentation: One Size Does Not Fit All

2. **Operations Excellence & Continuous Improvement** (4 modules)
   - Building a Culture of Continuous Improvement: Kaizen at Scale
   - Operations Excellence Frameworks: Shingo Model & TPM
   - Change Management for Operations Transformation
   - Benchmarking & Best Practice Adoption from RMG, Pharma & FMCG in Bangladesh

3. **Risk Management & Resilience** (4 modules)
   - Supply Chain Risk Identification: Natural Disasters, Geopolitical, Demand Volatility
   - Business Continuity Planning & Disaster Recovery for Operations
   - Building Resilient Supply Chains: Dual Sourcing, Safety Stock & Nearshoring
   - Case Studies: Bangladesh Garment Industry Resilience & COVID-19 Supply Chain Lessons

4. **Operations Leadership & Digital Transformation** (5 modules)
   - COO Mindset: From Plant Manager to Strategic Business Leader
   - Digital Supply Chain: AI, Machine Learning & Predictive Analytics
   - Sustainability in Operations: Green Supply Chain & Circular Economy
   - Cross-Functional Leadership: Operations + Finance + Sales Alignment
   - Future of Operations: Industry 4.0, Smart Factories & Autonomous Logistics

## Step 3: Create AI Instructor

**Name**: Rafiq Hasan
**Persona**: A veteran operations and supply chain professional with 18+ years of experience across manufacturing, logistics, and FMCG sectors in Bangladesh. Former Head of Supply Chain at a leading garment export group, with deep expertise in lean manufacturing, procurement, and logistics optimization. Uses real examples from Bangladesh's RMG sector, pharmaceutical companies (Square, Beximco), FMCG (PRAN, ACI), and global supply chain best practices adapted for the local context.

**Expertise areas**: Operations Management, Supply Chain Strategy, Lean Manufacturing, Six Sigma, Procurement, Logistics, Inventory Management, Quality Management, Production Planning, Digital Supply Chain

## Technical Details

### Database Operations
- **DELETE**: 2 placeholder courses from content table
- **INSERT**: 14 courses into `content` table with `profession_line_id = 'a8c5f269-03bd-4589-954e-51eb1e1fbf32'`
- **INSERT**: ~62 modules into `course_modules` with talking-point descriptions
- **INSERT**: 1 AI instructor record into `ai_instructors`
- All courses: `content_type = 'recorded_course'`, `is_published = true`

### IDs
- Program: `a8c5f269-03bd-4589-954e-51eb1e1fbf32`
- Foundation: `9578ed0c-dfc6-4e62-a1b6-0a96161cc4fe`
- Intermediate: `7e997803-47f3-423e-9790-da9612328cf5`
- Executive: `b7976d18-957b-4dc4-8a95-bbfd44877225`

### No Code Changes Needed
- Pages dynamically load from database
- AI instructor chat edge function already has the curriculum knowledge base loader built in

