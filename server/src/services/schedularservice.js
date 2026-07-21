import cron from 'node-cron';
import logger from '../config/logger.js';
import emailService from './emailService.js';
import notificationService from './notificationService.js';

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  start() {
    logger.info('Starting scheduler service...');

    const processQueueJob = cron.schedule('*/2 * * * *', async () => {
      logger.info('Running email queue processor...');
      try {
        const result = await emailService.processPendingEmails();
        logger.info('Queue processing complete', result);
      } catch (error) {
        logger.error('Queue processing failed', { error: error.message });
      }
    });
    this.jobs.push(processQueueJob);

    const dailyCron = process.env.DAILY_SUMMARY_CRON || '0 9 * * *';
    const dailyJob = cron.schedule(dailyCron, async () => {
      logger.info('Running daily summary job...');
      try {
        const count = await notificationService.sendDailySummaryToAll();
        logger.info(`Daily summary complete: ${count} emails queued`);
      } catch (error) {
        logger.error('Daily summary job failed', { error: error.message });
      }
    });
    this.jobs.push(dailyJob);

    const lowBalanceJob = cron.schedule('0 */6 * * *', async () => {
      logger.info('Running low balance alert check...');
      try {
        const count = await notificationService.checkAndSendLowBalanceAlerts();
        logger.info(`Low balance check complete: ${count} alerts queued`);
      } catch (error) {
        logger.error('Low balance check failed', { error: error.message });
      }
    });
    this.jobs.push(lowBalanceJob);

    const weeklyCron = process.env.WEEKLY_SUMMARY_CRON || '0 9 * * 1';
    const weeklyJob = cron.schedule(weeklyCron, async () => {
      logger.info('Running weekly summary job...');
      try {
        const count = await notificationService.sendWeeklySummaryToAll();
        logger.info(`Weekly summary complete: ${count} emails queued`);
      } catch (error) {
        logger.error('Weekly summary job failed', { error: error.message });
      }
    });
    this.jobs.push(weeklyJob);

    const monthlyCron = process.env.MONTHLY_SUMMARY_CRON || '0 9 1 * *';
    const monthlyJob = cron.schedule(monthlyCron, async () => {
      logger.info('Running monthly summary job...');
      try {
        const count = await notificationService.sendMonthlySummaryToAll();
        logger.info(`Monthly summary complete: ${count} emails queued`);
      } catch (error) {
        logger.error('Monthly summary job failed', { error: error.message });
      }
    });
    this.jobs.push(monthlyJob);

    logger.info('Scheduler service started with jobs:', {
      emailQueue: 'every 2 minutes',
      dailySummary: dailyCron,
      weeklySummary: weeklyCron,
      monthlySummary: monthlyCron,
      lowBalanceCheck: 'every 6 hours'
    });
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    logger.info('Scheduler service stopped');
  }
}

export default new SchedulerService();
