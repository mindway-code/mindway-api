import { startServer } from './infra/http/server.js';
import { logger } from './core/logger/logger.js';
import { prisma } from './infra/database/prisma/client.js';

async function main() {
  try {
    await startServer();
    logger.info('Server started successfully');
    await prisma.$connect();
    logger.info("✅ Connected to database");
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

main();
