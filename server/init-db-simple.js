const db = require('./config/db');

async function initDB() {
  try {
    console.log('Creating advance_payments table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS advance_payments (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50),
        month INT NOT NULL, -- 1-12
        year INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Table advance_payments created successfully (or already exists)');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

initDB();
