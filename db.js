const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'metadata.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TEXT,
      url TEXT,
      display_url TEXT,
      delete_url TEXT,
      isSuccess INTEGER,
      user_id INTEGER,
      source TEXT DEFAULT 'upload',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migrate existing table to have user_id if it doesn't already
  try {
    await db.exec(`ALTER TABLE uploads ADD COLUMN user_id INTEGER REFERENCES users(id)`);
  } catch (err) {}

  try {
    await db.exec(`ALTER TABLE uploads ADD COLUMN source TEXT DEFAULT 'upload'`);
  } catch (err) {}

  return db;
}

module.exports = { getDb };
