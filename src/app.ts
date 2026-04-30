import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import projectRoutes from './modules/project/project.routes';
import taskRoutes from './modules/task/task.routes';

const app = express();

// CORS — allow Vercel/Netlify deploys + local dev
const ALLOWED_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,           // localhost any port
  /^https:\/\/.*\.vercel\.app$/,             // any Vercel preview/prod URL
  /^https:\/\/.*\.netlify\.app$/,            // any Netlify URL
  /^https:\/\/.*\.onrender\.com$/,           // Render frontends
];

const isAllowedOrigin = (origin: string): boolean => {
  if (env.CLIENT_URL && origin === env.CLIENT_URL) return true;
  return ALLOWED_PATTERNS.some(pattern => pattern.test(origin));
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // Postman / mobile / SSR
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes
app.use(helmet({ crossOriginResourcePolicy: false }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
