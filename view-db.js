const { getDb } = require('./db');

async function viewDb() {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM uploads ORDER BY date DESC');
    console.log(`\n=== Database Contents (${rows.length} rows) ===\n`);
    if (rows.length > 0) {
        console.table(rows, ['name', 'date', 'url', 'isSuccess']);
    } else {
        console.log("Database is empty.");
    }
  } catch (err) {
    console.error('Error reading database:', err);
  }
}

viewDb();
