import dotenv from "dotenv";
dotenv.config();



const PORT = process.env.PORT || 4000;
const API_URL = `http://localhost:${PORT}/api/v1/transactions`;
const NUM_MESSAGES = 50; // Change this to generate more or fewer messages

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLoadTest() {
  console.log(`Starting load test to generate ${NUM_MESSAGES} transactions...`);
  
  try {
    const { default: db } = await import('./src/config/db.js');
    
    // 1. Get active accounts
    const result = await db.query("SELECT account_id FROM accounts WHERE status = 'active' LIMIT 10");
    if (result.rows.length === 0) {
      console.error("No active accounts found in the database to test with.");
      process.exit(1);
    }
    
    const accounts = result.rows.map(row => row.account_id);
    console.log(`Found ${accounts.length} active accounts. Proceeding to generate traffic...`);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < NUM_MESSAGES; i++) {
      const accountId = accounts[Math.floor(Math.random() * accounts.length)];
      const type = Math.random() > 0.5 ? 'deposit' : 'withdrawal';
      const amount = Math.floor(Math.random() * 4000) + 1000; // 1000 to 5000 to trigger large transaction alerts
      
      const payload = {
        accountId,
        transaction_type: type,
        amount,
        description: `Load test transaction ${i+1}`
      };

      try {
        const response = await globalThis.fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`[Success] Inserted ${type} of $${amount} for account ${accountId}`);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error(`[Failed] Transaction failed:`, errData);
          failCount++;
        }
      } catch (err) {
        console.error(`[Failed] Request error: ${err.message}`);
        failCount++;
      }
      
      // Sleep a bit to not overwhelm the local server completely and simulate real traffic
      await sleep(100); 
    }
    
    console.log(`\nLoad test completed!`);
    console.log(`Successful transactions: ${successCount}`);
    console.log(`Failed transactions: ${failCount}`);
    
    db.pool.end();
  } catch (error) {
    console.error("Error running load test:", error);
  }
}

runLoadTest();
