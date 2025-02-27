const Database = require("better-sqlite3");
const path = require("path");

// 1. Construct the path to your SQLite file
const dbPath = path.join(__dirname, "mydatabase.db");

// 2. Create (or open) the database
// Pass options if you want, e.g. { verbose: console.log } for logging
const db = new Database(dbPath);

// 3. Optionally create tables if they don't exist
// For example, a "users" table:
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    passwordHash TEXT NOT NULL
  )
`);

// 4. Export the db instance
module.exports = db;
