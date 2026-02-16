import { startServer } from './infra/http/server.js';
import { logger } from './core/logger/logger.js';

async function main() {
  try {
    const server = await startServer();
    logger.info('Server started successfully');
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

main();
