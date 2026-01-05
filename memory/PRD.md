# VulnShop - Vulnerable E-commerce Lab PRD

## Problem Statement
Membuat website e-commerce vulnerable untuk laboratorium cyber security dengan kerentanan teknis dan logika bisnis.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (NoSQL Injection) + SQLite (SQL Injection)
- **Auth**: JWT-based authentication

## User Personas
1. **Security Students** - Learning web vulnerabilities
2. **Penetration Testers** - Practicing exploitation techniques
3. **Security Instructors** - Teaching cybersecurity concepts

## Core Requirements (Static)
| Requirement | Status |
|-------------|--------|
| SQL Injection | ✅ Implemented |
| NoSQL Injection | ✅ Implemented |
| Command Injection | ✅ Implemented |
| SSRF | ✅ Implemented (Dec 2025) |
| XXE | ✅ Implemented (Dec 2025) |
| IDOR | ✅ Implemented |
| Privilege Escalation | ✅ Implemented |
| Stored XSS | ✅ Implemented |
| Reflected XSS | ✅ Implemented |
| Negative Price/Quantity | ✅ Implemented |
| Coupon Reuse | ✅ Implemented |
| Hidden Admin Dashboard | ✅ Implemented |
| Documentation Page | ✅ Implemented (Dec 2025) |

## What's Been Implemented

### Phase 1 (December 2025)
- Full e-commerce functionality
- 12 initial vulnerabilities
- Cyber-themed UI

### Phase 2 (December 2025)
**New Vulnerabilities:**
1. **SSRF - Webhook Test** (`/api/webhook/test`) - POST request to fetch any URL
2. **SSRF - Image Fetch** (`/api/fetch-image?url=`) - GET request for image URLs
3. **XXE - Product Import** (`/api/import/products`) - XML parsing with external entities
4. **XXE - Config Import** (`/api/config/import`) - Raw XML body parsing

**Documentation System:**
- `/vulnerabilities` - Full documentation page
- `/api/vulnerabilities` - API endpoint with all vuln details
- 16 total vulnerabilities documented
- Cheat sheets for SQLi, NoSQLi, SSRF, XXE, XSS, Business Logic
- Category filtering (7 categories)
- Expandable exploitation details
- CWE references with external links

### Total Vulnerabilities: 16
| Category | Count |
|----------|-------|
| Injection | 4 |
| Server-Side Request Forgery | 2 |
| XML External Entity | 2 |
| Broken Access Control | 3 |
| Cross-Site Scripting | 2 |
| Business Logic | 2 |
| Security Misconfiguration | 1 |

## Prioritized Backlog

### P0 - Done
- All core vulnerabilities (16)
- Basic e-commerce flow
- Cyber-themed UI
- Documentation page
- SSRF & XXE vulnerabilities

### P1 - Future Enhancements
- Vulnerability difficulty levels (Easy/Medium/Hard)
- Progress tracking/leaderboard
- Hints system toggle

### P2 - Nice to Have
- Docker containerization
- Reset functionality
- Score calculation
- Certificate generation

## Next Tasks
1. Add difficulty toggle for each vulnerability
2. Create progress tracking system
3. Implement leaderboard for CTF-style challenges
4. Add more advanced vulnerabilities (Deserialization, JWT attacks)
