# TaskForge — Project Management App

A full-stack project management web application with authentication, role-based access control, project & task management, and a real-time dashboard.

## Tech Stack

- **Frontend:** React 18, Vite, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Deployment:** Railway

## Features

- 🔐 **Authentication** — Signup/Login with JWT tokens
- 📁 **Project Management** — Create, edit, archive, delete projects
- 👥 **Team Management** — Add/remove members with Admin/Member roles
- ✅ **Task Tracking** — Create, assign, update status, set priorities & due dates
- 📊 **Dashboard** — Stats cards, pie/bar charts, overdue tasks, activity feed
- 🔒 **RBAC** — Global roles (Admin/Member) + project-level roles
- 📱 **Responsive** — Mobile-first design with collapsible sidebar

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database (Local or Atlas)

### Setup

1. **Clone and install:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure environment:**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your DATABASE_URL (MongoDB connection string)
   ```

3. **Setup database:**
   ```bash
   cd server
   npx prisma db push
   npx prisma generate
   ```

4. **Run development servers:**
   ```bash
   # Terminal 1 — Backend
   cd server && npm run dev

   # Terminal 2 — Frontend
   cd client && npm run dev
   ```

5. Open http://localhost:5173

## Railway + Supabase Deployment

1. Push code to GitHub.
2. Create a project on [Supabase](https://supabase.com).
3. **Get Connection String**:
   - Go to **Settings** -> **Database**.
   - Under "Connection string", select **URI**.
   - **IMPORTANT**: Click **"Pooler settings"** and ensure Mode is set to **"Transaction"** (Port 6543).
   - Copy the URI.
4. **Configure Railway**:
   - Create a new project on Railway from your GitHub repo.
   - Set `DATABASE_URL` to the URI you copied.
   - **IMPORTANT**: Add `?pgbouncer=true` to the end of your connection string.
   - Replace `[YOUR-PASSWORD]` with your actual Supabase database password.
5. Set other variables: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`.
6. Deploy.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| GET | `/api/projects/:id/tasks` | List tasks |
| POST | `/api/projects/:id/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/dashboard/overdue` | Overdue tasks |
| GET | `/api/dashboard/recent-activity` | Activity feed |
