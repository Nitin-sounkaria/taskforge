import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFound } from './middleware/errorHandler';

console.log('🏗️ TaskForge: Booting server...');
console.log('📂 Current Directory:', process.cwd());
const clientPath = path.resolve(process.cwd(), 'public');
console.log('📂 Target Client Path:', clientPath);

try {
  if (fs.existsSync(clientPath)) {
    console.log('✅ Public folder found!');
    console.log('📂 Public folder contents:', fs.readdirSync(clientPath));
  } else {
    console.log('❌ Public folder NOT found!');
    console.log('📂 Current directory contents:', fs.readdirSync(process.cwd()));
  }
} catch (e) {
  console.log('❌ Could not scan public directory');
}

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: true, // Allow the current domain
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check (at the top for reliability)
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve frontend in production (High priority)
const isProduction = env.NODE_ENV.trim().toLowerCase() === 'production';
console.log(`🌐 Mode Check: isProduction = ${isProduction} (Value: "${env.NODE_ENV}")`);

if (isProduction) {
  console.log('✅ Enabling Production Frontend Serving');
  app.use(express.static(clientPath));
  
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientPath, 'index.html'));
    }
    next();
  });
}

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

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 TaskForge server running on port ${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});

export default app;
