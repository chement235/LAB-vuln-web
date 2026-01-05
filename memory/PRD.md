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
| SSRF | ✅ Implemented |
| XXE | ✅ Implemented |
| IDOR | ✅ Implemented |
| Privilege Escalation | ✅ Implemented |
| Stored XSS | ✅ Implemented |
| Reflected XSS | ✅ Implemented |
| Negative Price/Quantity | ✅ Implemented |
| Coupon Reuse | ✅ Implemented |
| Hidden Admin Dashboard | ✅ Implemented |
| Documentation Page | ✅ Implemented |
| Insecure Deserialization | ✅ Implemented (Dec 2025) |
| JWT Attacks | ✅ Implemented (Dec 2025) |

## What's Been Implemented

### Phase 1 (December 2025)
- Full e-commerce functionality
- 12 initial vulnerabilities
- Cyber-themed UI

### Phase 2 (December 2025)
- SSRF endpoints (2)
- XXE endpoints (2)
- Documentation page with cheat sheets

### Phase 3 (December 2025)
**Insecure Deserialization (3 vulnerabilities):**
1. `POST /api/deserialize` - Pickle/YAML deserialization
2. `GET /api/session/load?data=` - Session pickle via GET
3. `POST /api/cache/restore` - YAML deserialization

**JWT Vulnerabilities (5 vulnerabilities):**
1. `POST /api/jwt/forge-admin` - None algorithm bypass (FLAG included)
2. `GET /api/jwt/verify` - Weak secret verification
3. `POST /api/jwt/decode` - Algorithm confusion
4. `POST /api/jwt/create` - Arbitrary token creation
5. `GET /api/jwt/secret-hint` - CTF hints for cracking

### Total Vulnerabilities: 24
| Category | Count |
|----------|-------|
| Injection | 4 |
| Server-Side Request Forgery | 2 |
| XML External Entity | 2 |
| Broken Access Control | 3 |
| Cross-Site Scripting | 2 |
| Business Logic | 2 |
| Security Misconfiguration | 1 |
| Insecure Deserialization | 3 |
| JWT Vulnerabilities | 5 |

### CTF Flags
- Hidden Admin: `FLAG{y0u_f0und_th3_4dm1n_p4n3l}`
- JWT Bypass: `FLAG{jwt_n0n3_4lg0r1thm_byp4ss}`

## Prioritized Backlog

### P0 - Done
- All 24 vulnerabilities
- E-commerce flow
- Cyber-themed UI
- Full documentation with cheat sheets
- CTF flags

### P1 - Future Enhancements
- Difficulty levels (Easy/Medium/Hard)
- Progress tracking/leaderboard
- User score system

### P2 - Nice to Have
- Docker containerization
- Environment reset functionality
- Certificate generation
- More advanced vulnerabilities (Type Juggling, Race Conditions)

## Next Tasks
1. Add difficulty toggle for each vulnerability
2. Create progress tracking system with user scores
3. Implement leaderboard for CTF-style challenges
4. Add Type Juggling and Race Condition vulnerabilities
