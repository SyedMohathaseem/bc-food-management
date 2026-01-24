const db = require('./config/db');

async function check() {
  console.log('--- CUSTOMER TABLE DIAGNOSTIC ---');
  
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM customers');
    console.log('Table `customers` Columns:');
    cols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
    
    // Check if 'address' and 'start_date' exist
    const hasAddress = cols.some(c => c.Field === 'address');
    const hasStartDate = cols.some(c => c.Field === 'start_date');
    
    console.log(`Has Address: ${hasAddress}`);
    console.log(`Has Start Date: ${hasStartDate}`);
    
    if (!hasAddress || !hasStartDate) {
      console.log('STATUS: SCHEMA MISMATCH DETECTED');
    } else {
      console.log('STATUS: SCHEMA OK');
    }
    
  } catch (e) {
    console.error('Check Table: FAILED', e.message);
  }
  process.exit(0);
}

check();
