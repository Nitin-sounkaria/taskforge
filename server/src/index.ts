import fs from 'fs';
import path from 'path';
console.log('📂 Current Directory:', process.cwd());
const clientPath = path.resolve(process.cwd(), '../client/dist');
console.log('📂 Target Client Path:', clientPath);

try {
  if (fs.existsSync(clientPath)) {
    console.log('✅ Client dist folder found!');
    console.log('📂 Client dist contents:', fs.readdirSync(clientPath));
  } else {
    console.log('❌ Client dist folder NOT found at this path!');
    console.log('📂 Parent of Client Path contents:', fs.readdirSync(path.resolve(clientPath, '..')));
  }
} catch (e) {
  console.log('❌ Could not scan client directory');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: env.NODE_ENV === 'production' ? true : env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check (at the top for reliability)
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Rate limiting on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check

// Serve frontend in production
if (env.NODE_ENV === 'production') {
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'), (err) => {
        if (err) {
          console.error('❌ Failed to send index.html:', err);
          res.status(404).json({ 
            error: 'Frontend build not found', 
            pathChecked: clientPath,
            filesPresent: fs.existsSync(clientPath) ? fs.readdirSync(clientPath) : 'none'
          });
        }
      });
    }
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 TaskForge server running on port ${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🛠️ Deployment Command: cd server && (npx prisma migrate deploy || echo 'Migration failed') && node dist/index.js`);
});

export default app;
