import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { authenticate, requireRole } from '../middleware/auth';
import { resumeUpload } from '../middleware/upload';
import * as healthController from '../controllers/healthController';
import * as profileController from '../controllers/profileController';
import * as jobController from '../controllers/jobController';
import * as applicationController from '../controllers/applicationController';
import * as postController from '../controllers/postController';
import * as aiController from '../controllers/aiController';
import * as automationController from '../controllers/automationController';

const aiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'AI rate limit exceeded' },
  },
});

export const apiRouter = Router();

apiRouter.get('/health', healthController.health);

// n8n pushes normalized jobs here (X-Ingest-Key) — no user JWT required
apiRouter.post('/jobs/ingest', jobController.ingestJobs);

// Daily automation can be triggered with ingest key before auth (for cron/n8n)
apiRouter.post('/automation/daily/run', automationController.runDailyNow);

apiRouter.use(authenticate);

apiRouter.get('/me', profileController.getProfile);
apiRouter.patch('/me', profileController.updateProfile);
apiRouter.post('/me/resume', resumeUpload.single('resume'), profileController.uploadResume);
apiRouter.post('/me/resume/build', profileController.buildResume);
apiRouter.post('/me/resume/optimize', profileController.optimizeResume);
apiRouter.get('/me/resume', profileController.getLatestResume);
apiRouter.get('/me/resumes', profileController.listResumes);
apiRouter.get('/me/cover-letters', profileController.listCoverLetters);

apiRouter.get('/jobs', jobController.searchJobs);
apiRouter.get('/jobs/board', postController.listFormalJobs);
apiRouter.get('/jobs/today', jobController.todaysJobs);
apiRouter.get('/jobs/recommended', jobController.recommendedJobs);
apiRouter.get('/jobs/saved', jobController.listSavedJobs);
apiRouter.get('/jobs/catalog', jobController.catalogStatus);
apiRouter.post('/jobs/refresh', jobController.refreshJobs);
apiRouter.get('/jobs/:id', jobController.getJob);
apiRouter.post('/jobs/:id/save', jobController.saveJob);

apiRouter.get('/posts', postController.listPosts);
apiRouter.get('/posts/:id', postController.getPost);

apiRouter.get('/applications', applicationController.listApplications);
apiRouter.get('/applications/stats', applicationController.getStats);
apiRouter.post('/applications/smart-apply', applicationController.smartApply);
apiRouter.post('/applications/outreach-apply', applicationController.outreachApplyHandler);
apiRouter.post('/applications/auto-apply', applicationController.autoApplyHandler);
apiRouter.patch('/applications/:id/status', applicationController.updateApplicationStatus);

apiRouter.get('/automation/daily/status', automationController.getDailyStatus);
apiRouter.post('/automation/daily/run-auth', automationController.runDailyNow);

apiRouter.post('/ai/cover-letter', aiLimiter, aiController.generateCoverLetter);

apiRouter.get('/admin/ping', requireRole('admin'), (_req, res) => {
  res.json({ success: true, data: { ok: true, role: 'admin' } });
});
