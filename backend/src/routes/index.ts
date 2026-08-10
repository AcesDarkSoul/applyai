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
import * as notificationController from '../controllers/notificationController';
import * as complianceController from '../controllers/complianceController';

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
apiRouter.delete('/jobs/:id/save', jobController.unsaveJob);

apiRouter.get('/posts', postController.listPosts);
apiRouter.get('/posts/:id', postController.getPost);

apiRouter.get('/applications', applicationController.listApplications);
apiRouter.get('/applications/stats', applicationController.getStats);
apiRouter.get('/applications/check-duplicate', applicationController.checkDuplicate);
apiRouter.post('/applications/smart-apply', applicationController.smartApply);
apiRouter.post('/applications/outreach-apply', applicationController.outreachApplyHandler);
apiRouter.post('/applications/auto-apply', applicationController.autoApplyHandler);
apiRouter.patch('/applications/:id/status', applicationController.updateApplicationStatus);
apiRouter.post('/applications/sync-statuses', applicationController.syncStatuses);

apiRouter.get('/notifications', notificationController.listNotifications);
apiRouter.post('/notifications/read-all', notificationController.markAllNotificationsRead);
apiRouter.patch('/notifications/:id/read', notificationController.markNotificationRead);
apiRouter.patch('/notifications/prefs', notificationController.updateNotificationPrefs);
apiRouter.post('/notifications/push-token', notificationController.registerPushToken);

apiRouter.get('/compliance/settings', complianceController.getComplianceSettings);
apiRouter.post('/compliance/consent', complianceController.confirmSmartApplyConsent);
apiRouter.patch('/compliance/platforms', complianceController.updateSmartApplyPlatforms);
apiRouter.get('/compliance/audit', complianceController.listAuditLog);

apiRouter.get('/automation/daily/status', automationController.getDailyStatus);
apiRouter.post('/automation/daily/run-auth', automationController.runDailyNow);

apiRouter.post('/ai/cover-letter', aiLimiter, aiController.generateCoverLetter);
apiRouter.post('/ai/tailor-resume', aiLimiter, aiController.tailorResume);
apiRouter.get('/ai/skill-gap/:jobId', aiLimiter, aiController.skillGap);
apiRouter.post('/ai/skill-gap', aiLimiter, aiController.skillGap);

apiRouter.get('/admin/ping', requireRole('admin'), (_req, res) => {
  res.json({ success: true, data: { ok: true, role: 'admin' } });
});
