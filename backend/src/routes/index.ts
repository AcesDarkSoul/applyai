import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { authenticate, requireRole } from '../middleware/auth';
import { optionalResumeUpload } from '../middleware/upload';
import * as healthController from '../controllers/healthController';
import * as profileController from '../controllers/profileController';
import * as jobController from '../controllers/jobController';
import * as applicationController from '../controllers/applicationController';
import * as postController from '../controllers/postController';
import * as aiController from '../controllers/aiController';
import * as automationController from '../controllers/automationController';
import * as notificationController from '../controllers/notificationController';
import * as complianceController from '../controllers/complianceController';
import * as billingController from '../controllers/billingController';
import { requireFeature } from '../middleware/requirePlan';

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

// Public catalog (no auth) — app can show prices before / after login
apiRouter.get('/billing/plans', billingController.listPlans);

// n8n pushes normalized jobs here (X-Ingest-Key) — no user JWT required
apiRouter.post('/jobs/ingest', jobController.ingestJobs);

// Daily automation can be triggered with ingest key before auth (for cron/n8n)
apiRouter.post('/automation/daily/run', automationController.runDailyNow);

apiRouter.use(authenticate);

apiRouter.get('/billing/subscription', billingController.getSubscription);
apiRouter.post('/billing/razorpay/order', billingController.createOrder);
apiRouter.post('/billing/razorpay/verify', billingController.verifyPayment);
apiRouter.post('/billing/demo-activate', billingController.demoActivate);

apiRouter.get('/me', profileController.getProfile);
apiRouter.patch('/me', profileController.updateProfile);
apiRouter.post('/me/resume', optionalResumeUpload, profileController.uploadResume);
apiRouter.post('/me/resume/build', profileController.buildResume);
apiRouter.post('/me/resume/optimize', profileController.optimizeResume);
apiRouter.get('/me/resume', profileController.getLatestResume);
apiRouter.get('/me/resumes', profileController.listResumes);
apiRouter.get('/me/cover-letters', profileController.listCoverLetters);

apiRouter.get('/jobs', requireFeature('jobs'), jobController.searchJobs);
apiRouter.get('/jobs/board', requireFeature('jobs'), postController.listFormalJobs);
apiRouter.get('/jobs/today', requireFeature('jobs'), jobController.todaysJobs);
apiRouter.get('/jobs/recommended', requireFeature('jobs'), jobController.recommendedJobs);
apiRouter.get('/jobs/saved', requireFeature('jobs'), jobController.listSavedJobs);
apiRouter.get('/jobs/catalog', requireFeature('jobs'), jobController.catalogStatus);
apiRouter.post('/jobs/refresh', requireFeature('jobRefresh'), jobController.refreshJobs);
apiRouter.get('/jobs/:id', requireFeature('jobs'), jobController.getJob);
apiRouter.post('/jobs/:id/save', requireFeature('jobs'), jobController.saveJob);
apiRouter.delete('/jobs/:id/save', requireFeature('jobs'), jobController.unsaveJob);

apiRouter.get('/posts', requireFeature('posts'), postController.listPosts);
apiRouter.get('/posts/:id', requireFeature('posts'), postController.getPost);

apiRouter.get('/applications', applicationController.listApplications);
apiRouter.get('/applications/stats', applicationController.getStats);
apiRouter.get('/applications/check-duplicate', applicationController.checkDuplicate);
apiRouter.post('/applications/smart-apply', requireFeature('smartApply'), applicationController.smartApply);
apiRouter.post(
  '/applications/outreach-apply',
  requireFeature('outreach'),
  applicationController.outreachApplyHandler,
);
apiRouter.post('/applications/auto-apply', requireFeature('autoApply'), applicationController.autoApplyHandler);
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

apiRouter.post('/ai/cover-letter', requireFeature('aiCoverLetters'), aiLimiter, aiController.generateCoverLetter);
apiRouter.post('/ai/tailor-resume', requireFeature('aiTools'), aiLimiter, aiController.tailorResume);
apiRouter.get('/ai/skill-gap/:jobId', requireFeature('aiTools'), aiLimiter, aiController.skillGap);
apiRouter.post('/ai/skill-gap', requireFeature('aiTools'), aiLimiter, aiController.skillGap);

apiRouter.get('/admin/ping', requireRole('admin'), (_req, res) => {
  res.json({ success: true, data: { ok: true, role: 'admin' } });
});
