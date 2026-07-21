import db from '../config/db.js';
import logger from '../config/logger.js';
import emailService from '../services/emailService.js';
import notificationService from '../services/notificationService.js';

class EmailController {
  async sendBalanceEmail(req, res, next) {
    try {
      const { customerId, accountId } = req.params;
      const notificationId = await notificationService.sendBalanceNotification(customerId, accountId);

      res.status(200).json({
        success: true,
        message: 'Balance email queued successfully',
        data: { notificationId }
      });
    } catch (error) {
      logger.error('Failed to queue balance email', { error: error.message });
      next(error);
    }
  }

  async sendTransactionSummaryEmail(req, res, next) {
    try {
      const { customerId, accountId } = req.params;
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      const notificationId = await notificationService.sendTransactionSummary(
        customerId, accountId, startDate, endDate
      );

      res.status(200).json({
        success: true,
        message: 'Transaction summary email queued',
        data: { notificationId }
      });
    } catch (error) {
      logger.error('Failed to queue summary email', { error: error.message });
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const { customerId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = `SELECT notification_id, notification_type, recipient_email, subject,
                          scheduled_at, sent_at, status, retry_count, error_message, created_at
                   FROM email_notifications WHERE customer_id = $1`;
      const params = [customerId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      paramCount++;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await db.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: { count: result.rowCount, limit: parseInt(limit), offset: parseInt(offset) }
      });
    } catch (error) {
      logger.error('Error fetching notifications', { error: error.message });
      next(error);
    }
  }

  async getAllNotifications(req, res, next) {
    try {
      const { status, limit = 100, offset = 0 } = req.query;

      let query = `SELECT en.notification_id, en.notification_type, en.recipient_email,
                          en.subject, en.scheduled_at, en.sent_at, en.status,
                          en.retry_count, en.error_message, en.created_at,
                          c.first_name, c.last_name
                   FROM email_notifications en
                   JOIN customers c ON en.customer_id = c.customer_id`;
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` WHERE en.status = $${paramCount}`;
        params.push(status);
      }

      paramCount++;
      query += ` ORDER BY en.created_at DESC LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await db.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: { count: result.rowCount, limit: parseInt(limit), offset: parseInt(offset) }
      });
    } catch (error) {
      logger.error('Error fetching all notifications', { error: error.message });
      next(error);
    }
  }

  async processQueue(req, res, next) {
    try {
      const result = await emailService.processPendingEmails();
      res.status(200).json({
        success: true,
        message: 'Email queue processed',
        data: result
      });
    } catch (error) {
      logger.error('Queue processing failed', { error: error.message });
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM customers WHERE status = 'active') AS total_customers,
          (SELECT COUNT(*) FROM accounts WHERE status = 'active') AS total_accounts,
          (SELECT COUNT(*) FROM email_notifications WHERE status = 'pending') AS pending_emails,
          (SELECT COUNT(*) FROM email_notifications WHERE status = 'sent' AND sent_at >= NOW() - INTERVAL '24 hours') AS sent_today,
          (SELECT COUNT(*) FROM email_notifications WHERE status = 'failed') AS failed_emails,
          (SELECT COUNT(*) FROM transactions WHERE created_at >= NOW() - INTERVAL '24 hours') AS transactions_today
      `);

      const recentEmails = await db.query(
        `SELECT en.notification_id, en.notification_type, en.recipient_email,
                en.status, en.sent_at, en.created_at,
                c.first_name, c.last_name
         FROM email_notifications en
         JOIN customers c ON en.customer_id = c.customer_id
         ORDER BY en.created_at DESC LIMIT 10`
      );

      res.status(200).json({
        success: true,
        data: {
          stats: stats.rows[0],
          recentEmails: recentEmails.rows
        }
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error: error.message });
      next(error);
    }
  }
}

export default new EmailController();
