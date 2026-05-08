console.log('🏗️ TaskForge: Booting server...');
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
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
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
