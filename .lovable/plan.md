

# Program 3: Cybersecurity — Full Curriculum Build

## Current State
- **Program ID**: `b8272dfc-5191-40c9-8908-0cd5d302de79`
- **Career outcome**: Not set (null)
- **Courses**: 2 placeholders (no modules)
- **AI Instructor**: None

## Step 1: Update Program Metadata
- Set `career_outcome` to "Cybersecurity Analyst, Penetration Tester, Security Engineer, SOC Analyst"

## Step 2: Delete 2 Placeholder Courses
Remove:
- "Cybersecurity Fundamentals for Professionals"
- "Information Security & Risk Management"

## Step 3: Insert 14 Courses (3 levels)

### Foundation (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Introduction to Cybersecurity & Information Security | 4 |
| 2 | Networking Fundamentals for Security | 5 |
| 3 | Operating Systems & Command Line for Security | 4 |
| 4 | Security Principles & Risk Management | 4 |
| 5 | Introduction to Cryptography | 4 |

### Intermediate (5 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Ethical Hacking & Penetration Testing | 5 |
| 2 | Network Security & Firewall Management | 4 |
| 3 | Web Application Security | 5 |
| 4 | Security Operations & Incident Response | 4 |
| 5 | Identity & Access Management | 4 |

### Executive (4 courses)
| # | Title | Modules |
|---|-------|---------|
| 1 | Cloud Security & Zero Trust Architecture | 5 |
| 2 | Digital Forensics & Malware Analysis | 4 |
| 3 | Governance, Compliance & Security Leadership | 4 |
| 4 | Capstone: Build a Security Operations Program | 4 |

**Total: 14 courses, 66 modules**

## Step 4: Create AI Instructor

- **Name**: Amara Osei
- **Persona**: A cybersecurity veteran with 14+ years defending critical infrastructure across financial services, government, and tech. Former SOC lead and red team operator. Holds CISSP and OSCP certifications. Known for demystifying complex attack vectors and making defensive thinking second nature.
- **Expertise**: Penetration Testing, Network Security, Incident Response, Cloud Security, Cryptography, Risk Management, SOC Operations, Web App Security, Digital Forensics
- **Teaching style**: Threat-first and scenario-driven; starts every topic with "what can go wrong" before teaching the defense. Uses real breach case studies (SolarWinds, Log4j, Colonial Pipeline) and hands-on lab thinking. Balances offensive and defensive mindsets.

## Execution Order
1. Update career_outcome
2. Delete 2 placeholder courses
3. Insert 14 courses with correct level IDs
4. Insert 66 modules across all courses
5. Insert AI Instructor (Amara Osei)

## Technical Details
- **Level IDs**: Foundation (`9578ed0c-...`), Intermediate (`7e997803-...`), Executive (`b7976d18-...`)
- All operations are data inserts/updates/deletes -- no code changes needed
- Courses use type `recorded_course`, status `published`, `is_active = true`

