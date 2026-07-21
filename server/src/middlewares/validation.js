import { ApiError } from '../utils/ApiError.js';

export function validateUUID(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!value || !uuidRegex.test(value)) {
      return next(new ApiError(400, `Invalid ${paramName}: must be a valid UUID`));
    }
    next();
  };
}

export function validateTransaction(req, res, next) {
  const { accountId, transaction_type, amount } = req.body;
  const errors = [];

  if (!accountId) errors.push('accountId is required');
  if (!transaction_type) errors.push('transaction_type is required');

  const validTypes = ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'fee'];
  if (transaction_type && !validTypes.includes(transaction_type)) {
    errors.push(`transaction_type must be one of: ${validTypes.join(', ')}`);
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push('amount must be a positive number');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
}

export function validateDateRange(req, res, next) {
  const { start_date, end_date } = req.query;

  if (start_date && isNaN(Date.parse(start_date))) {
    return next(new ApiError(400, 'Invalid start_date format'));
  }

  if (end_date && isNaN(Date.parse(end_date))) {
    return next(new ApiError(400, 'Invalid end_date format'));
  }

  if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
    return next(new ApiError(400, 'start_date must be before end_date'));
  }

  next();
}
