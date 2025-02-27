// src/modules/authentication/auth.controller.js
const authService = require("./auth.service");

// Handle user registration
async function register(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: "Missing userId or password" });
  }

  try {
    const newRowId = authService.registerUser(userId, password);
    return res.status(201).json({ message: "User created", id: newRowId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Handle login
async function login(req, res) {
  const { userId, password } = req.body;

  const user = authService.getUserByUserId(userId);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await require("bcrypt").compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // If using sessions, store userId in session
  req.session.userId = user.id;
  return res.json({ message: "Login successful", userId: user.id });
}

module.exports = {
  register,
  login,
};
