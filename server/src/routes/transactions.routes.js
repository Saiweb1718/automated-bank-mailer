import express from 'express';
import transactionController from '../controllers/transcation.controller.js';
import { validateTransaction, validateUUID, validateDateRange } from '../middlewares/validation.js';

const router = express.Router();

router.post('/', validateTransaction, transactionController.createTransaction);
router.get('/:accountId/history', validateUUID('accountId'), validateDateRange, transactionController.getTransactionHistory);

export default router;
