

# Healthcare & Pharma -- Full Curriculum + AI Instructor

## Step 1: Remove Placeholder Courses
Delete the 2 existing courses (no modules, no enrollments):
- Healthcare Management & Administration
- Pharmaceutical Business & Compliance

## Step 2: Insert Full Curriculum (14 courses, ~62 modules)

### Foundation Level (5 courses)

1. **Introduction to Healthcare Systems** (4 modules)
   - Overview of Healthcare Systems: Public, Private & Mixed Models in Bangladesh
   - Healthcare Stakeholders: Patients, Providers, Payers & Regulators
   - Primary, Secondary & Tertiary Care: Structure & Referral Pathways
   - Introduction to Health Policy & the DGHS Framework in Bangladesh

2. **Pharmaceutical Industry Fundamentals** (4 modules)
   - The Pharmaceutical Value Chain: R&D to Patient Access
   - Drug Classification: OTC, Prescription, Generics & Biologics
   - Pharmaceutical Manufacturing: GMP & Quality Assurance Basics
   - Bangladesh Pharma Landscape: Top Companies, Export Markets & Growth Drivers

3. **Healthcare Operations & Administration** (5 modules)
   - Hospital Operations: OPD, IPD, Emergency & Support Services
   - Patient Flow Management & Appointment Scheduling Systems
   - Healthcare Human Resources: Staffing Models & Credential Verification
   - Medical Records Management & Introduction to EMR/EHR Systems
   - Healthcare Facility Planning: Layout, Equipment & Maintenance

4. **Medical Sales & Product Knowledge** (4 modules)
   - Understanding Drug Nomenclature: Generic, Brand & Chemical Names
   - Therapeutic Area Basics: Cardiovascular, Diabetes, Antibiotics & Oncology
   - Medical Device Categories & Regulatory Classification
   - Building Product Knowledge for Effective Medical Detailing

5. **Healthcare Quality & Patient Safety** (4 modules)
   - Introduction to Patient Safety & Medical Error Prevention
   - Healthcare Quality Indicators: Mortality, Infection Rates & Readmissions
   - Accreditation Standards: JCI, NABH & Bangladesh Hospital Accreditation
   - Infection Prevention & Control (IPC) Fundamentals

### Intermediate Level (5 courses)

1. **Pharmaceutical Regulatory Affairs** (5 modules)
   - Drug Registration Process: DGDA Approval Pathway in Bangladesh
   - International Regulatory Frameworks: FDA, EMA & WHO Prequalification
   - Clinical Trial Phases: From Preclinical to Post-Market Surveillance
   - Pharmacovigilance & Adverse Drug Reaction Reporting
   - Regulatory Documentation: CTD Format, DMF & Labeling Requirements

2. **Healthcare Marketing & Market Access** (4 modules)
   - Pharmaceutical Marketing Strategy: Ethical Promotion & DGDA Guidelines
   - Key Account Management for Hospitals & Pharmacy Chains
   - Market Access & Formulary Listing Strategies
   - Digital Marketing in Healthcare: Telemedicine, Health Apps & Online Pharmacies

3. **Supply Chain for Pharma & Healthcare** (5 modules)
   - Cold Chain Management: Vaccines, Biologics & Temperature-Sensitive Products
   - Pharmaceutical Distribution: C&F Agents, Wholesalers & Retail Pharmacies
   - Inventory Management for Hospitals & Pharmacies: FEFO, Expiry Tracking
   - GDP (Good Distribution Practice) & Anti-Counterfeiting Measures
   - Procurement in Healthcare: Tenders, Rate Contracts & Group Purchasing

4. **Hospital Management & Leadership** (4 modules)
   - Hospital Financial Management: Revenue Cycle, Billing & Cost Control
   - Managing Clinical Departments: KPIs, Protocols & Outcome Measurement
   - Healthcare Information Systems: HIS, LIS, RIS & PACS Integration
   - Leadership in Healthcare: Managing Doctors, Nurses & Allied Health Staff

5. **Clinical Research & Data Management** (5 modules)
   - Introduction to Clinical Research: Study Design & Methodology
   - Good Clinical Practice (GCP) & Ethics Committee Approval
   - Clinical Data Management: EDC Systems, CRFs & Data Cleaning
   - Biostatistics Fundamentals for Clinical Research
   - Real-World Evidence & Post-Market Studies in Bangladesh Context

### Executive Level (4 courses)

1. **Healthcare Strategy & Policy** (5 modules)
   - Strategic Planning for Healthcare Organizations
   - Health Economics: Cost-Effectiveness, QALY & Budget Impact Analysis
   - Public Health Programs: UHC, Essential Drug Lists & National Health Policy
   - Public-Private Partnership Models in Bangladesh Healthcare
   - Healthcare Regulation & Governance: BMDC, BPC & DGDA Roles

2. **Pharmaceutical Business Strategy** (4 modules)
   - Pharma Business Models: Innovator vs Generic vs CDMO/CMO
   - Export Strategy: Entering Regulated Markets (US, EU, Africa)
   - Portfolio Strategy: Product Lifecycle Management & Pipeline Planning
   - M&A, Licensing & Strategic Alliances in Pharma

3. **Digital Health & Innovation** (5 modules)
   - Telemedicine & Remote Patient Monitoring Implementation
   - AI & Machine Learning Applications in Healthcare & Drug Discovery
   - Health Data Analytics: Predictive Models & Population Health Management
   - Medical IoT: Wearables, Smart Devices & Connected Health Ecosystems
   - Digital Therapeutics & the Future of Personalized Medicine

4. **Healthcare Leadership & Transformation** (4 modules)
   - CEO/MD Mindset: Leading Healthcare Organizations Through Change
   - Building a Culture of Clinical Excellence & Continuous Improvement
   - Cross-Functional Leadership: Clinical + Operations + Finance Alignment
   - Future of Healthcare in Bangladesh: Universal Health Coverage, Biotech & Precision Medicine

## Step 3: Create AI Instructor

**Name**: Dr. Fahmida Akter
**Persona**: A healthcare and pharmaceutical industry veteran with 16+ years of experience spanning hospital administration, pharmaceutical regulatory affairs, and clinical operations in Bangladesh. Former Director of Operations at a leading private hospital group and ex-Head of Regulatory at a top-5 pharmaceutical company. Brings real-world examples from Bangladesh's healthcare ecosystem including Square Hospitals, Evercare, United Hospital, and pharmaceutical giants like Square Pharma, Beximco Pharma, Incepta, and Renata. Passionate about improving healthcare delivery and building the next generation of healthcare leaders in Bangladesh.

**Expertise areas**: Healthcare Administration, Pharmaceutical Regulatory Affairs, Hospital Management, Clinical Research, Medical Sales, Healthcare Quality, Pharma Supply Chain, Digital Health, Healthcare Strategy, Patient Safety

## Technical Details

### Database Operations
- **DELETE**: 2 placeholder courses from content table
- **INSERT**: 14 courses into `content` table with `profession_line_id = '2c541af4-1cc0-4704-81aa-78df992aad6b'`
- **INSERT**: ~62 modules into `course_modules` with talking-point descriptions
- **INSERT**: 1 AI instructor record into `ai_instructors`
- All courses: `content_type = 'recorded_course'`, `is_published = true`

### IDs
- Program: `2c541af4-1cc0-4704-81aa-78df992aad6b`
- Foundation: `9578ed0c-dfc6-4e62-a1b6-0a96161cc4fe`
- Intermediate: `7e997803-47f3-423e-9790-da9612328cf5`
- Executive: `b7976d18-957b-4dc4-8a95-bbfd44877225`

### No Code Changes Needed
- Pages dynamically load from database
- AI instructor chat edge function already has the curriculum knowledge base loader built in

