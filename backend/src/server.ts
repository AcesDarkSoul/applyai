import { createApp } from './app';
import { env, isDemoMode } from './config/env';
import { logger } from './config/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`ApplyAI API listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
  logger.info(`Demo mode: ${isDemoMode}`);
});
