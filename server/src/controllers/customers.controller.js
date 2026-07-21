import db from '../config/db.js';
import logger from '../config/logger.js';

class CustomersController {
  async getAllCustomers(req, res, next) {
    try {
      const result = await db.query(
        `SELECT c.customer_id, c.first_name, c.last_name, c.email, c.phone,
                c.status, c.email_verified, c.created_at,
                COUNT(a.account_id) AS account_count,
                COALESCE(SUM(a.balance), 0) AS total_balance
         FROM customers c
         LEFT JOIN accounts a ON c.customer_id = a.customer_id
         GROUP BY c.customer_id
         ORDER BY c.created_at DESC`
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });
    } catch (error) {
      logger.error('Error fetching customers', { error: error.message });
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const { customerId } = req.params;

      const customerResult = await db.query(
        `SELECT c.*, ep.daily_summary, ep.weekly_summary, ep.monthly_summary,
                ep.transaction_alerts, ep.low_balance_alerts,
                ep.large_transaction_threshold, ep.low_balance_threshold,
                ep.preferred_time, ep.timezone
         FROM customers c
         LEFT JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE c.customer_id = $1`,
        [customerId]
      );

      if (customerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      const accountsResult = await db.query(
        `SELECT account_id, account_number, account_type, balance, currency, status, opened_date
         FROM accounts WHERE customer_id = $1 ORDER BY opened_date DESC`,
        [customerId]
      );

      res.status(200).json({
        success: true,
        data: {
          ...customerResult.rows[0],
          accounts: accountsResult.rows
        }
      });
    } catch (error) {
      logger.error('Error fetching customer', { error: error.message });
      next(error);
    }
  }

  async updateEmailPreferences(req, res, next) {
    try {
      const { customerId } = req.params;
      const {
        daily_summary, weekly_summary, monthly_summary,
        transaction_alerts, low_balance_alerts,
        large_transaction_threshold, low_balance_threshold,
        preferred_time, timezone
      } = req.body;

      const result = await db.query(
        `UPDATE email_preferences SET
           daily_summary = COALESCE($1, daily_summary),
           weekly_summary = COALESCE($2, weekly_summary),
           monthly_summary = COALESCE($3, monthly_summary),
           transaction_alerts = COALESCE($4, transaction_alerts),
           low_balance_alerts = COALESCE($5, low_balance_alerts),
           large_transaction_threshold = COALESCE($6, large_transaction_threshold),
           low_balance_threshold = COALESCE($7, low_balance_threshold),
           preferred_time = COALESCE($8, preferred_time),
           timezone = COALESCE($9, timezone)
         WHERE customer_id = $10
         RETURNING *`,
        [
          daily_summary, weekly_summary, monthly_summary,
          transaction_alerts, low_balance_alerts,
          large_transaction_threshold, low_balance_threshold,
          preferred_time, timezone, customerId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Preferences not found' });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error updating preferences', { error: error.message });
      next(error);
    }
  }
}

export default new CustomersController();
