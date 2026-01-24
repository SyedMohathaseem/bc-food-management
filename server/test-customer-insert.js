const db = require('./config/db');

async function testInsert() {
  console.log('--- TEST INSERT CUSTOMER ---');
  
  const id = `test_${Date.now()}`;
  const c = {
    name: 'Test Customer',
    mobile: '1234567890',
    address: '123 Test St',
    subscriptionType: 'monthly',
    dailyAmount: 1500,
    mealTimes: ['lunch', 'dinner'],
    advanceAmount: 0,
    referral: '',
    startDate: '2026-01-24',
    status: 'active'
  };
  
  try {
    const mealTimes = JSON.stringify(c.mealTimes);
    console.log('Attempting insert with params:', c);
    
    await db.query(
      'INSERT INTO customers (id, name, mobile, address, subscription_type, daily_amount, meal_times, advance_amount, referral, start_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, c.name, c.mobile, c.address, c.subscriptionType, c.dailyAmount, mealTimes, c.advanceAmount, c.referral, c.startDate, c.status]
    );
    console.log('Insert SUCCESS');
    
    // Clean up
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
    
  } catch (error) {
    console.error('Insert FAILED:', error);
    console.error('Code:', error.code);
    console.error('Message:', error.sqlMessage);
  }
  process.exit(0);
}

testInsert();
