import express from 'express';
import emailController from '../controllers/email.controller.js';
import { validateUUID } from '../middlewares/validation.js';

const router = express.Router();

router.get('/dashboard', emailController.getDashboardStats);
router.get('/notifications', emailController.getAllNotifications);
router.get('/notifications/:customerId', validateUUID('customerId'), emailController.getNotifications);
router.post('/send-balance/:customerId/:accountId', validateUUID('customerId'), emailController.sendBalanceEmail);
router.post('/send-summary/:customerId/:accountId', validateUUID('customerId'), emailController.sendTransactionSummaryEmail);
router.post('/process-queue', emailController.processQueue);

export default router;
