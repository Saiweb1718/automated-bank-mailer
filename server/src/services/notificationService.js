import db from '../config/db.js';
import emailService from './emailService.js';
import logger from '../config/logger.js';

class NotificationService {
  async sendBalanceNotification(customerId, accountId) {
    try {
      const result = await db.query(
        `SELECT c.customer_id, c.first_name, c.last_name, c.email,
                a.account_id, a.account_number, a.account_type, a.balance, a.currency
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         WHERE c.customer_id = $1 AND a.account_id = $2 AND c.status = 'active'`,
        [customerId, accountId]
      );

      if (result.rows.length === 0) {
        throw new Error('Customer or account not found');
      }

      const data = result.rows[0];
      const subject = `Account Balance Update - ${data.account_number}`;

      const templateData = {
        firstName: data.first_name,
        lastName: data.last_name,
        accountNumber: data.account_number,
        accountType: data.account_type,
        balance: parseFloat(data.balance).toFixed(2),
        currency: data.currency,
        date: new Date().toLocaleDateString()
      };

      return await emailService.queueEmail(
        customerId,
        'account_balance',
        data.email,
        subject,
        templateData
      );
    } catch (error) {
      logger.error('Failed to send balance notification', { error: error.message });
      throw error;
    }
  }

  async sendTransactionSummary(customerId, accountId, startDate, endDate) {
    try {
      const customerResult = await db.query(
        `SELECT c.customer_id, c.first_name, c.last_name, c.email,
                a.account_number, a.account_type, a.balance, a.currency
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         WHERE c.customer_id = $1 AND a.account_id = $2`,
        [customerId, accountId]
      );

      if (customerResult.rows.length === 0) {
        throw new Error('Customer or account not found');
      }

      const transactionsResult = await db.query(
        `SELECT transaction_type, amount, balance_after, description,
                transaction_date, reference_number, status
         FROM transactions
         WHERE account_id = $1
         AND transaction_date BETWEEN $2 AND $3
         AND status = 'completed'
         ORDER BY transaction_date DESC`,
        [accountId, startDate, endDate]
      );

      const customer = customerResult.rows[0];
      const transactions = transactionsResult.rows;

      const totalDeposits = transactions
        .filter(t => ['deposit', 'transfer_in'].includes(t.transaction_type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalWithdrawals = transactions
        .filter(t => ['withdrawal', 'transfer_out', 'payment'].includes(t.transaction_type))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const subject = `Transaction Summary - ${customer.account_number}`;

      const templateData = {
        firstName: customer.first_name,
        lastName: customer.last_name,
        accountNumber: customer.account_number,
        accountType: customer.account_type,
        currentBalance: parseFloat(customer.balance).toFixed(2),
        currency: customer.currency,
        startDate: new Date(startDate).toLocaleDateString(),
        endDate: new Date(endDate).toLocaleDateString(),
        totalTransactions: transactions.length,
        totalDeposits: totalDeposits.toFixed(2),
        totalWithdrawals: totalWithdrawals.toFixed(2),
        transactions: transactions.slice(0, 10)
      };

      return await emailService.queueEmail(
        customerId,
        'transaction_summary',
        customer.email,
        subject,
        templateData
      );
    } catch (error) {
      logger.error('Failed to send transaction summary', { error: error.message });
      throw error;
    }
  }

  async checkAndSendLowBalanceAlerts() {
    try {
      const result = await db.query(
        `SELECT c.customer_id, c.first_name, c.email,
                a.account_id, a.account_number, a.balance, a.currency,
                ep.low_balance_threshold
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE a.status = 'active'
         AND c.status = 'active'
         AND ep.low_balance_alerts = true
         AND a.balance < ep.low_balance_threshold`
      );

      logger.info(`Found ${result.rows.length} accounts with low balance`);

      for (const account of result.rows) {
        const subject = `Low Balance Alert - ${account.account_number}`;

        const templateData = {
          firstName: account.first_name,
          accountNumber: account.account_number,
          balance: parseFloat(account.balance).toFixed(2),
          threshold: parseFloat(account.low_balance_threshold).toFixed(2),
          currency: account.currency
        };

        await emailService.queueEmail(
          account.customer_id,
          'low_balance_alert',
          account.email,
          subject,
          templateData
        );
      }

      return result.rows.length;
    } catch (error) {
      logger.error('Failed to check low balance alerts', { error: error.message });
      throw error;
    }
  }

  async sendDailySummaryToAll() {
    try {
      const customers = await db.query(
        `SELECT c.customer_id, a.account_id
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE c.status = 'active' AND a.status = 'active' AND ep.daily_summary = true`
      );

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let queued = 0;
      for (const row of customers.rows) {
        try {
          await this.sendTransactionSummary(
            row.customer_id, row.account_id, yesterday, today
          );
          queued++;
        } catch (err) {
          logger.error('Failed daily summary for customer', {
            customerId: row.customer_id,
            error: err.message
          });
        }
      }

      logger.info(`Daily summaries queued: ${queued}/${customers.rows.length}`);
      return queued;
    } catch (error) {
      logger.error('Failed to run daily summary job', { error: error.message });
      throw error;
    }
  }

  async sendWeeklySummaryToAll() {
    try {
      const customers = await db.query(
        `SELECT c.customer_id, a.account_id
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE c.status = 'active' AND a.status = 'active' AND ep.weekly_summary = true`
      );

      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);

      let queued = 0;
      for (const row of customers.rows) {
        try {
          await this.sendTransactionSummary(
            row.customer_id, row.account_id, lastWeek, today
          );
          queued++;
        } catch (err) {
          logger.error('Failed weekly summary for customer', { customerId: row.customer_id, error: err.message });
        }
      }

      logger.info(`Weekly summaries queued: ${queued}/${customers.rows.length}`);
      return queued;
    } catch (error) {
      logger.error('Failed to run weekly summary job', { error: error.message });
      throw error;
    }
  }

  async sendMonthlySummaryToAll() {
    try {
      const customers = await db.query(
        `SELECT c.customer_id, a.account_id
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE c.status = 'active' AND a.status = 'active' AND ep.monthly_summary = true`
      );

      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);

      let queued = 0;
      for (const row of customers.rows) {
        try {
          await this.sendTransactionSummary(
            row.customer_id, row.account_id, lastMonth, today
          );
          queued++;
        } catch (err) {
          logger.error('Failed monthly summary for customer', { customerId: row.customer_id, error: err.message });
        }
      }

      logger.info(`Monthly summaries queued: ${queued}/${customers.rows.length}`);
      return queued;
    } catch (error) {
      logger.error('Failed to run monthly summary job', { error: error.message });
      throw error;
    }
  }

  async checkAndSendImmediateAlerts(customerId, accountId, transaction) {
    try {
      const result = await db.query(
        `SELECT c.first_name, c.email, a.account_number, a.currency,
                ep.transaction_alerts, ep.large_transaction_threshold,
                ep.low_balance_alerts, ep.low_balance_threshold
         FROM customers c
         JOIN accounts a ON c.customer_id = a.customer_id
         JOIN email_preferences ep ON c.customer_id = ep.customer_id
         WHERE c.customer_id = $1 AND a.account_id = $2
         AND c.status = 'active' AND a.status = 'active'`,
        [customerId, accountId]
      );

      if (result.rows.length === 0) return;

      const prefs = result.rows[0];

      // 1. Check for Large Transaction Alert
      if (prefs.transaction_alerts && parseFloat(transaction.amount) >= parseFloat(prefs.large_transaction_threshold)) {
        const subject = `Large Transaction Alert - ${prefs.account_number}`;
        const templateData = {
          firstName: prefs.first_name,
          accountNumber: prefs.account_number,
          transactionType: transaction.transaction_type,
          amount: parseFloat(transaction.amount).toFixed(2),
          currency: prefs.currency,
          threshold: parseFloat(prefs.large_transaction_threshold).toFixed(2),
          date: new Date().toLocaleDateString()
        };
        await emailService.queueEmail(
          customerId,
          'large_transaction_alert',
          prefs.email,
          subject,
          templateData
        );
        logger.info(`Queued large transaction alert for ${customerId}`);
      }

      // 2. Check for Low Balance Alert
      if (prefs.low_balance_alerts && parseFloat(transaction.balance_after) < parseFloat(prefs.low_balance_threshold)) {
        const subject = `Low Balance Alert - ${prefs.account_number}`;
        const templateData = {
          firstName: prefs.first_name,
          accountNumber: prefs.account_number,
          balance: parseFloat(transaction.balance_after).toFixed(2),
          currency: prefs.currency,
          threshold: parseFloat(prefs.low_balance_threshold).toFixed(2)
        };
        await emailService.queueEmail(
          customerId,
          'low_balance_alert',
          prefs.email,
          subject,
          templateData
        );
        logger.info(`Queued low balance alert for ${customerId}`);
      }
    } catch (error) {
      logger.error('Failed to process immediate alerts', { error: error.message });
      // We don't throw here because we don't want to fail the transaction if the alert fails to queue
    }
  }
}

export default new NotificationService();