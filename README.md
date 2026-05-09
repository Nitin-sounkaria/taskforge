# TaskForge Strategic Operations Hub

## Enterprise-Grade Project Management & Workforce Intelligence

TaskForge is a high-performance, secure Strategic Operations platform designed for centralized project management and real-time workforce intelligence. Built with a focus on data integrity, security, and administrative control, it empowers organizations to delegate tasks, track project lifecycles, and monitor operational efficiency with forensic precision.

---

## 🖥️ Platform Overview

TaskForge provides a tailored experience based on organizational roles, ensuring that every user has the exact tools they need for their level of responsibility.

### 👤 Member Experience
The Member interface is optimized for personal productivity and clear task execution.

- **Personal Productivity Dashboard**: A focused view of assigned tasks, project progress, and priority breakdowns.
- **Task Lifecycle Management**: Streamlined workflows for moving tasks through 'To Do', 'In Progress', and 'Review' stages.
- **Recent Activity Feed**: Real-time updates on personal and project-level changes.

![Member Dashboard](https://github.com/Nitin-sounkaria/taskforge/raw/main/docs/screenshots/member_dashboard.png)
*Figure 1: The Member Dashboard focusing on personal project execution.*

---

### 🛡️ Administrative Experience (Master Control)
The Administrative interface provides high-level strategic oversight and system-wide control.

- **Operational Command Center**: A forensic look at member attendance, device security, and shift logs.
- **Global Activity Trends**: 14-day visualization of organizational productivity and task creation velocity.
- **Strategic Task Delegation**: The ability to assign tasks to any member across any project from a centralized console.
- **System-Wide Intelligence**: Real-time stats on total projects, overdue risks, and completed milestones.

![Admin Master Control](https://github.com/Nitin-sounkaria/taskforge/raw/main/docs/screenshots/admin_dashboard.png)
*Figure 2: The Administrative Master Control panel with global analytics.*

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

---

## 🛠️ Technical Architecture

### Core Stack
- **Frontend**: React.js with Vite, React Router v7, and TailwindCSS-integrated design systems.
- **Backend**: Node.js & Express with TypeScript for strict type safety.
- **Database**: PostgreSQL (Supabase) managed via Prisma ORM for type-safe database access.
- **Visualization**: Interactive data analytics powered by Recharts.

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
