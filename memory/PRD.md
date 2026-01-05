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
| IDOR | ✅ Implemented |
| Privilege Escalation | ✅ Implemented |
| Stored XSS | ✅ Implemented |
| Reflected XSS | ✅ Implemented |
| Negative Price/Quantity | ✅ Implemented |
| Coupon Reuse | ✅ Implemented |
| Hidden Admin Dashboard | ✅ Implemented |

## What's Been Implemented (December 2025)

### Vulnerabilities
1. **SQL Injection**
   - `/api/products/search?q=` - Search query injection
   - `/api/auth/legacy-login` - Login bypass

2. **NoSQL Injection**
   - `/api/users/lookup?filter={}` - JSON filter injection

3. **Command Injection**
   - `/api/export/orders` - Filename/format injection

4. **IDOR**
   - `/api/profile/{user_id}` - Access any user profile
   - `/api/orders/{order_id}` - Access any order

5. **Privilege Escalation**
   - `/api/profile/update` - Change role to admin

6. **XSS**
   - Stored XSS in product reviews (dangerouslySetInnerHTML)
   - Reflected XSS at `/api/search/render?q=`

7. **Business Logic**
   - Negative quantities allowed in checkout
   - Coupon codes can be reused
   - Rounding errors in calculations

8. **Hidden Admin Panel**
   - Challenge: `/api/c0ntr0l-p4n3l/`
   - Contains flag: `FLAG{y0u_f0und_th3_4dm1n_p4n3l}`

### E-commerce Features
- Product listing with categories
- Product detail pages
- User registration/login
- Shopping cart
- Checkout with coupons
- Order history
- User profiles

## Prioritized Backlog

### P0 - Done
- All core vulnerabilities
- Basic e-commerce flow
- Cyber-themed UI

### P1 - Future Enhancements
- Vulnerability difficulty levels (Easy/Medium/Hard)
- Hints system for each vulnerability
- Progress tracking/leaderboard
- More injection points

### P2 - Nice to Have
- Docker containerization
- Reset functionality
- Score calculation
- Certificate generation

## Next Tasks
1. Add documentation for each vulnerability
2. Implement difficulty toggle
3. Add more advanced vulnerabilities (SSRF, XXE)
4. Create teacher/admin dashboard for tracking student progress
