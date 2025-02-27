// src/modules/authentication/auth.service.js
const db = require("@/db"); // relative path to the db folder
const bcrypt = require("bcrypt");

// Insert a new user
function registerUser(userId, plainPassword) {
  const passwordHash = bcrypt.hashSync(plainPassword, 10); // synchronous for simplicity

  // Using better-sqlite3
  const insertStmt = db.prepare(`
    INSERT INTO users (userId, passwordHash)
    VALUES (?, ?)
  `);

  try {
    const result = insertStmt.run(userId, passwordHash);
    return result.lastInsertRowid; // the new user ID in the table
  } catch (error) {
    throw new Error("Error inserting user: " + error.message);
  }
}

// Fetch user by userId
function getUserByUserId(userId) {
  const selectStmt = db.prepare(`
    SELECT * FROM users
    WHERE userId = ?
  `);

  return selectStmt.get(userId); // returns the row object or undefined
}

module.exports = {
  registerUser,
  getUserByUserId,
};
