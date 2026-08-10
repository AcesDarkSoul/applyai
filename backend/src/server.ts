import { createApp } from './app';
import { env, isDemoMode } from './config/env';
import { logger } from './config/logger';
import { startDailyAutomationScheduler } from './services/dailyAutomationService';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`ApplyAI API listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
  logger.info(`Demo mode: ${isDemoMode}`);
  startDailyAutomationScheduler();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  logger.error(`HTTP server failed to start ${err.message}`, { code: err.code });
  process.exit(1);
});
