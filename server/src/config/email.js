import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed', { error: error.message });
  } else {
    logger.info('Email server is ready to send messages');
  }
});

export default transporter;