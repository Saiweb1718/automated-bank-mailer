import dotenv from "dotenv";
dotenv.config();

import db from "./config/db.js";
import app from "./app.js";
import logger from "./config/logger.js";
import schedulerService from "./services/schedularservice.js";

const port = process.env.PORT || 4000;

(async () => {
  try {
    await db.query("SELECT 1");
    logger.info("Database connected successfully");

    schedulerService.start();

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Health check: http://localhost:${port}/api/health`);
      logger.info(`API base: http://localhost:${port}/api/${process.env.API_VERSION || 'v1'}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
})();

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  schedulerService.stop();
  db.pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  schedulerService.stop();
  db.pool.end();
  process.exit(0);
});