import transporter from '../config/email.js';
import logger from '../config/logger.js';
import db from '../config/db.js';
import { generateEmailTemplate } from '../utils/templates.js';

class EmailService {
  async sendEmail(notificationId, recipientEmail, subject, htmlContent, metadata = {}) {
    const maxRetries = parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        const mailOptions = {
          from: `${process.env.EMAIL_FROM_NAME || 'Banking System'} <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: subject,
          html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);

        await db.query(
          `UPDATE email_notifications
           SET status = 'sent', sent_at = NOW(), metadata = $1
           WHERE notification_id = $2`,
          [JSON.stringify({ ...metadata, messageId: info.messageId }), notificationId]
        );

        logger.info(`Email sent successfully to ${recipientEmail}`, {
          notificationId,
          messageId: info.messageId,
          subject
        });

        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastError = error;
        attempt++;

        logger.warn(`Email send attempt ${attempt} failed for ${recipientEmail}`, {
          notificationId,
          error: error.message,
          attempt
        });

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          await db.query(
            `UPDATE email_notifications
             SET retry_count = $1, status = 'retrying'
             WHERE notification_id = $2`,
            [attempt, notificationId]
          );
        }
      }
    }

    await db.query(
      `UPDATE email_notifications
       SET status = 'failed', error_message = $1, retry_count = $2
       WHERE notification_id = $3`,
      [lastError.message, maxRetries, notificationId]
    );

    logger.error(`Email failed after ${maxRetries} attempts to ${recipientEmail}`, {
      notificationId,
      error: lastError.message
    });

    return { success: false, error: lastError.message };
  }

  async queueEmail(customerId, notificationType, recipientEmail, subject, templateData, scheduledAt = null) {
    try {
      const emailBody = generateEmailTemplate(notificationType, templateData);

      const useDbNow = !scheduledAt;
      const query = useDbNow
        ? `INSERT INTO email_notifications
           (customer_id, notification_type, recipient_email, subject, email_body, scheduled_at, metadata)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)
           RETURNING notification_id`
        : `INSERT INTO email_notifications
           (customer_id, notification_type, recipient_email, subject, email_body, scheduled_at, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING notification_id`;

      const params = useDbNow
        ? [customerId, notificationType, recipientEmail, subject, emailBody, JSON.stringify(templateData)]
        : [customerId, notificationType, recipientEmail, subject, emailBody, scheduledAt, JSON.stringify(templateData)];

      const result = await db.query(query, params);

      logger.info(`Email queued for ${recipientEmail}`, {
        notificationId: result.rows[0].notification_id,
        notificationType,
        scheduledAt: useDbNow ? 'NOW()' : scheduledAt
      });

      return result.rows[0].notification_id;
    } catch (error) {
      logger.error('Failed to queue email', { error: error.message });
      throw error;
    }
  }

  async processPendingEmails() {
    try {
      const result = await db.query(
        `SELECT notification_id, recipient_email, subject, email_body, metadata
         FROM email_notifications
         WHERE status IN ('pending', 'retrying')
         AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 50`
      );

      const emails = result.rows;
      logger.info(`Processing ${emails.length} pending emails`);

      if (emails.length === 0) return { total: 0, successful: 0, failed: 0 };

      const sendPromises = emails.map(email =>
        this.sendEmail(
          email.notification_id,
          email.recipient_email,
          email.subject,
          email.email_body,
          email.metadata
        )
      );

      const results = await Promise.allSettled(sendPromises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      logger.info(`Email batch processed: ${successful} sent, ${failed} failed`);

      return { total: emails.length, successful, failed };
    } catch (error) {
      logger.error('Error processing pending emails', { error: error.message });
      throw error;
    }
  }
}

export default new EmailService();
