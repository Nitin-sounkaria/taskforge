# TaskForge

TaskForge is a high-performance, full-stack task management application designed for teams and individuals who demand speed, security, and a beautiful user interface. Built with the modern web stack, it offers real-time organization, project tracking, and insightful analytics.

## ✨ Features

- **Project Management**: Organize tasks into dedicated projects with unique tracking.
- **Dynamic Dashboard**: Real-time analytics and status tracking for all your assignments.
- **Secure Authentication**: Robust JWT-based security with secure password hashing and refresh token logic.
- **PostgreSQL Power**: Backed by Supabase for enterprise-grade data reliability and performance.
- **Premium UI**: Sleek, responsive design built for both desktop and mobile productivity.

## 🚀 Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Hosting**: Railway & Supabase

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Supabase account (PostgreSQL)

### 1. Clone the repository
```bash
git clone https://github.com/Nitin-sounkaria/taskforge.git
cd taskforge
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="your_supabase_connection_string"
JWT_SECRET="your_secure_random_string"
JWT_REFRESH_SECRET="your_secure_refresh_string"
PORT=3001
NODE_ENV=development
```

### 4. Database Setup
```bash
cd server
npx prisma db push
```

### 5. Run Locally
```bash
# In one terminal (Backend)
cd server
npm run dev

# In another terminal (Frontend)
cd client
npm run dev
```

## 🚢 Deployment (Railway)

This project is optimized for **Railway** deployment using Nixpacks.

1. Connect your GitHub repository to Railway.
2. Add the following Variables:
   - `DATABASE_URL`: Your Supabase connection string (Port 5432).
   - `JWT_SECRET`: A long random string.
   - `JWT_REFRESH_SECRET`: Another long random string.
   - `NODE_ENV`: `production`
3. Railway will automatically detect the `nixpacks.toml` and deploy the application.

## 📄 License

This project is licensed under the MIT License.
