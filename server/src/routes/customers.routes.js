import express from 'express';
import customersController from '../controllers/customers.controller.js';
import { validateUUID } from '../middlewares/validation.js';

const router = express.Router();

router.get('/', customersController.getAllCustomers);
router.get('/:customerId', validateUUID('customerId'), customersController.getCustomerById);
router.put('/:customerId/preferences', validateUUID('customerId'), customersController.updateEmailPreferences);

export default router;
