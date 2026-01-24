const db = require('./config/db');

async function updateDB() {
  try {
    console.log('Adding payment_notes column to invoices table...');
    
    // Check if column exists first to avoid error (though ADD COLUMN IF NOT EXISTS is cleaner in newer MySQL, staying safe)
    try {
      await db.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_notes TEXT
      `);
      console.log('Column payment_notes added successfully');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column payment_notes already exists');
      } else {
        throw err;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating table:', error);
    process.exit(1);
  }
}

updateDB();
