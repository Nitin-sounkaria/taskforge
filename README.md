# TaskForge Strategic Operations Hub

## Enterprise-Grade Project Management & Workforce Intelligence

TaskForge is a high-performance, secure Strategic Operations platform designed for centralized project management and real-time workforce intelligence. Built with a focus on data integrity, security, and administrative control, it empowers organizations to delegate tasks, track project lifecycles, and monitor operational efficiency with forensic precision.

---

## 🚀 Key Features

### 1. Strategic Operations Control
- **Global Delegation Engine**: Centralized task assignment across all organization projects.
- **Member Intelligence Deck**: Detailed profiling of workforce activity, device ecosystem, and productivity trends.
- **Operational Dashboard**: High-level system health metrics, including task distribution and overdue monitoring.

### 2. Forensic Workforce Tracking
- **Automated Attendance Logs**: Real-time "Clock-In" and "Clock-Out" tracking with session duration calculations.
- **Presence Intelligence**: Digital heartbeat system for accurate "Active" vs. "Away" status detection.
- **Device & Security Auditing**: IP-address tracking and device fingerprinting for comprehensive security audits.

### 3. Enterprise-Grade Security
- **Role-Based Access Control (RBAC)**: Strict separation of Administrative and Member privileges.
- **Hardened Security Headers**: Advanced Content Security Policy (CSP) and Helmet-secured middleware.
- **Authentication Guards**: Multi-layered JWT-based session management with secure refresh logic.

---

## 🛠️ Technical Architecture

### Core Stack
- **Frontend**: React.js with Vite, React Router v7, and TailwindCSS-integrated design systems.
- **Backend**: Node.js & Express with TypeScript for strict type safety.
- **Database**: PostgreSQL (Supabase) managed via Prisma ORM for type-safe database access.
- **Visualization**: Interactive data analytics powered by Recharts.

### Key Dependencies
- `helmet`: Security header hardening.
- `express-rate-limit`: DDoS and brute-force protection.
- `prisma`: Scalable database management and migrations.
- `lucide-react`: High-fidelity enterprise iconography.

---

## 📦 Deployment & Setup

### Environment Configuration
Ensure the following variables are configured in your `.env` file:
```bash
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secure_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
NODE_ENV="production"
```

### Installation
```bash
# Install dependencies
npm install

# Initialize database
cd server && npx prisma db push

# Build production assets
cd .. && npm run build

# Launch Strategic Hub
npm start
```

---

## 🛡️ Maintenance & Support
TaskForge is maintained by the Internal Operations Team. For access requests or technical audits, please contact the System Administrator.

---
© 2026 TaskForge Operations Hub. All Rights Reserved.
