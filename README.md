# TaskForge Strategic Operations Hub

TaskForge is a high-performance, secure Strategic Operations platform designed for centralized project management and real-time workforce intelligence. Built with a focus on data integrity, security, and administrative control, it empowers organizations to delegate tasks, track project lifecycles, and monitor operational efficiency with forensic precision.

---

## 🖥️ Platform Overview

TaskForge provides a tailored experience based on organizational roles, ensuring that every user has the exact tools they need for their level of responsibility.

### 👤 Member Experience
The Member interface is optimized for personal productivity and clear task execution.

- **Personal Productivity Dashboard**: A focused view of assigned tasks, project progress, and priority breakdowns.
- **Task Lifecycle Management**: Streamlined workflows for moving tasks through 'To Do', 'In Progress', and 'Review' stages.
- **Recent Activity Feed**: Real-time updates on personal and project-level changes.

<img width="800" height="400" alt="Screenshot 2026-05-09 174708" src="https://github.com/user-attachments/assets/1ecd59f5-1095-40d6-8cd5-914363015425" />
<br>
<img width="800" height="400" alt="Screenshot 2026-05-09 174816" src="https://github.com/user-attachments/assets/9eaea34c-1365-4b54-8e2c-96150302d386" />


---

### 🛡️ Administrative Experience (Master Control)
The Administrative interface provides high-level strategic oversight and system-wide control.

- **Operational Command Center**: A forensic look at member attendance, device security, and shift logs.
- **Global Activity Trends**: 14-day visualization of organizational productivity and task creation velocity.
- **Strategic Task Delegation**: The ability to assign tasks to any member across any project from a centralized console.
- **System-Wide Intelligence**: Real-time stats on total projects, overdue risks, and completed milestones.

<img width="800" height="400" alt="Screenshot 2026-05-09 175009" src="https://github.com/user-attachments/assets/1c759f3f-32f4-405d-87a0-f9cdb77ff87e" />
<br>
<img width="800" height="400" alt="Screenshot 2026-05-09 174938" src="https://github.com/user-attachments/assets/85f7b151-ab5e-410e-8f4e-ff8de4031a71" />
<br>
<img width="800" height="400" alt="Screenshot 2026-05-09 174911" src="https://github.com/user-attachments/assets/004ea26c-5d48-4964-873a-09adc5add137" />
<br>
<img width="800" height="400" alt="Screenshot 2026-05-09 174846" src="https://github.com/user-attachments/assets/8c43742d-ad4b-425f-aa78-2323e75fee02" />
<br>

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
