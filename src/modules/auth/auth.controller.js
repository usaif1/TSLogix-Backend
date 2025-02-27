// src/modules/authentication/auth.controller.js
const authService = require("./auth.service");
const bcrypt = require("bcrypt");

// Handle user registration
async function register(req, res) {
  const { userId, password, role, organization } = req.body;

  if (!userId || !password || !role) {
    return res
      .status(400)
      .json({ message: "Missing userId or password or role" });
  }

  try {
    const newRowId = await authService.registerUser(
      userId,
      password,
      role,
      organization
    );
    return res.status(201).json({ message: "User created", id: newRowId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Handle login
async function login(req, res) {
  const { userId, password } = req.body;

  try {
    const user = await authService.getUserByUserId(userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If using sessions, store userId in session
    req.session.userId = user.id;
    return res.json({ message: "Login successful", userId: user.id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
};
