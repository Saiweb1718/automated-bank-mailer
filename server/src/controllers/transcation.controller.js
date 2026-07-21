import { transactionreference } from "../utils/generatenums.js";
import db from "../config/db.js";
import logger from "../config/logger.js";
import notificationService from "../services/notificationService.js";

class TransactionController {
  async createTransaction(req, res, next) {
    const client = await db.getClient();

    try {
      const { accountId, transaction_type, amount, description } = req.body;
      await client.query("BEGIN");

      const accResult = await client.query(
        `SELECT balance, status, account_number, customer_id
         FROM accounts WHERE account_id = $1 FOR UPDATE`,
        [accountId]
      );

      if (accResult.rows.length === 0) {
        throw new Error("Account not found");
      }

      const acc = accResult.rows[0];
      if (acc.status !== "active") {
        throw new Error("Account is not active");
      }

      let newBalance = parseFloat(acc.balance);
      const txAmount = parseFloat(amount);

      if (txAmount <= 0) throw new Error("Amount must be positive");

      if (['withdrawal', 'transfer_out', 'payment', 'fee'].includes(transaction_type)) {
        newBalance -= txAmount;
      } else if (['deposit', 'transfer_in'].includes(transaction_type)) {
        newBalance += txAmount;
      } else {
        throw new Error(`Invalid transaction type: ${transaction_type}`);
      }

      if (newBalance < 0) throw new Error("Insufficient funds");

      const referenceNumber = transactionreference();

      const txnResult = await client.query(
        `INSERT INTO transactions
           (account_id, transaction_type, amount, balance_after, reference_number, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed')
         RETURNING transaction_id, transaction_date, reference_number`,
        [accountId, transaction_type, txAmount, newBalance, referenceNumber, description || null]
      );

      await client.query(
        `UPDATE accounts SET balance = $1, updated_at = NOW() WHERE account_id = $2`,
        [newBalance, accountId]
      );

      await client.query(
        `INSERT INTO audit_logs (table_name, record_id, action, new_values)
         VALUES ($1, $2, $3, $4)`,
        [
          'transactions',
          txnResult.rows[0].transaction_id,
          'INSERT',
          JSON.stringify({ accountId, transaction_type, amount: txAmount, newBalance })
        ]
      );

      await client.query('COMMIT');

      // Check and send immediate email alerts based on user preferences
      await notificationService.checkAndSendImmediateAlerts(
        acc.customer_id,
        accountId,
        {
          transaction_type,
          amount: txAmount,
          balance_after: newBalance
        }
      );

      logger.info('Transaction created', {
        transactionId: txnResult.rows[0].transaction_id,
        accountId,
        type: transaction_type,
        amount: txAmount
      });

      res.status(201).json({
        success: true,
        data: {
          ...txnResult.rows[0],
          amount: txAmount,
          balance_after: newBalance,
          transaction_type
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error: error.message });
      next(error);
    } finally {
      client.release();
    }
  }

  async getTransactionHistory(req, res, next) {
    try {
      const { accountId } = req.params;
      const { start_date, end_date, type, limit = 50, offset = 0 } = req.query;

      let query = `SELECT transaction_id, transaction_type, amount, balance_after,
                          reference_number, transaction_date, description, status
                   FROM transactions WHERE account_id = $1`;
      const params = [accountId];
      let paramCount = 1;

      if (start_date) {
        paramCount++;
        query += ` AND transaction_date >= $${paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND transaction_date <= $${paramCount}`;
        params.push(end_date);
      }

      if (type) {
        paramCount++;
        query += ` AND transaction_type = $${paramCount}`;
        params.push(type);
      }

      paramCount++;
      query += ` ORDER BY transaction_date DESC LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await db.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          count: result.rowCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      logger.error("Error retrieving transaction history", { error: error.message });
      next(error);
    }
  }
}

export default new TransactionController();