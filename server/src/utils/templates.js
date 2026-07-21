import Handlebars from 'handlebars';

// Base template wrapper
const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .balance { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    .table th { background: #f5f5f5; font-weight: bold; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    {{{content}}}
  </div>
</body>
</html>
`;

// Account balance template
const balanceTemplate = `
<div class="header">
  <h1>Account Balance Update</h1>
</div>
<div class="content">
  <p>Hello {{firstName}} {{lastName}},</p>
  <p>Here is your current account balance:</p>
  <div class="balance">{{currency}} {{balance}}</div>
  <table style="width: 100%; margin: 20px 0;">
    <tr>
      <td><strong>Account Number:</strong></td>
      <td>{{accountNumber}}</td>
    </tr>
    <tr>
      <td><strong>Account Type:</strong></td>
      <td style="text-transform: capitalize;">{{accountType}}</td>
    </tr>
    <tr>
      <td><strong>As of:</strong></td>
      <td>{{date}}</td>
    </tr>
  </table>
  <p>Thank you for banking with us.</p>
</div>
<div class="footer">
  <p>This is an automated message. Please do not reply to this email.</p>
  <p>&copy; 2025 Banking System. All rights reserved.</p>
</div>
`;

// Transaction summary template
const transactionSummaryTemplate = `
<div class="header">
  <h1>Transaction Summary</h1>
</div>
<div class="content">
  <p>Hello {{firstName}} {{lastName}},</p>
  <p>Here is your transaction summary for <strong>{{accountNumber}}</strong></p>
  <p><strong>Period:</strong> {{startDate}} to {{endDate}}</p>
  
  <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
    <h3 style="margin-top: 0;">Summary</h3>
    <p><strong>Current Balance:</strong> {{currency}} {{currentBalance}}</p>
    <p><strong>Total Transactions:</strong> {{totalTransactions}}</p>
    <p><strong>Total Deposits:</strong> {{currency}} {{totalDeposits}}</p>
    <p><strong>Total Withdrawals:</strong> {{currency}} {{totalWithdrawals}}</p>
  </div>

  {{#if transactions}}
  <h3>Recent Transactions</h3>
  <table class="table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each transactions}}
      <tr>
        <td>{{transaction_date}}</td>
        <td>{{description}}</td>
        <td style="text-transform: capitalize;">{{transaction_type}}</td>
        <td>{{../currency}} {{amount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/if}}

  <p>For detailed information, please log in to your account.</p>
</div>
<div class="footer">
  <p>This is an automated message. Please do not reply to this email.</p>
  <p>&copy; 2025 Banking System. All rights reserved.</p>
</div>
`;

// Low balance alert template
const lowBalanceTemplate = `
<div class="header">
  <h1>⚠️ Low Balance Alert</h1>
</div>
<div class="content">
  <p>Hello {{firstName}},</p>
  
  <div class="alert">
    <h3 style="margin-top: 0;">Your account balance is low</h3>
    <p><strong>Account:</strong> {{accountNumber}}</p>
    <p><strong>Current Balance:</strong> {{currency}} {{balance}}</p>
    <p><strong>Alert Threshold:</strong> {{currency}} {{threshold}}</p>
  </div>

  <p>Please consider adding funds to your account to avoid potential overdraft fees or declined transactions.</p>
  
  <a href="#" class="button">Add Funds</a>
</div>
<div class="footer">
  <p>This is an automated message. Please do not reply to this email.</p>
  <p>&copy; 2025 Banking System. All rights reserved.</p>
</div>
`;

// Large transaction alert template
const largeTransactionTemplate = `
<div class="header">
  <h1>🚨 Large Transaction Alert</h1>
</div>
<div class="content">
  <p>Hello {{firstName}},</p>
  
  <div class="alert" style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
    <h3 style="margin-top: 0;">A large transaction was processed on your account</h3>
    <p><strong>Account:</strong> {{accountNumber}}</p>
    <p><strong>Type:</strong> <span style="text-transform: capitalize;">{{transactionType}}</span></p>
    <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
    <p><strong>Date:</strong> {{date}}</p>
  </div>

  <p>This alert was triggered because the transaction exceeded your configured alert threshold of {{currency}} {{threshold}}.</p>
  <p>If you did not authorize this transaction, please contact support immediately.</p>
</div>
<div class="footer">
  <p>This is an automated message. Please do not reply to this email.</p>
  <p>&copy; 2025 Banking System. All rights reserved.</p>
</div>
`;

const templates = {
  account_balance: balanceTemplate,
  transaction_summary: transactionSummaryTemplate,
  daily_summary: transactionSummaryTemplate,
  weekly_summary: transactionSummaryTemplate,
  monthly_summary: transactionSummaryTemplate,
  low_balance_alert: lowBalanceTemplate,
  large_transaction_alert: largeTransactionTemplate,
};

/**
 * Generate email HTML from template
 */
function generateEmailTemplate(templateType, data) {
  const contentTemplate = templates[templateType];
  if (!contentTemplate) {
    throw new Error('Unknown template type: ' + templateType);
  }

  const compiledContent = Handlebars.compile(contentTemplate);
  const content = compiledContent(data);

  const compiledBase = Handlebars.compile(baseTemplate);
  return compiledBase({ content });
}

export { generateEmailTemplate };
