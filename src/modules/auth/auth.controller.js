// src/modules/authentication/auth.controller.js
const authService = require("./auth.service");

// Handle user registration
async function register(req, res) {
  const { userId, email, password, role, organisation_id } = req.body;

  if (!userId || !email || !password || !role || !organisation_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newRowId = await authService.registerUser(
      userId,
      email,
      password,
      role,
      organisation_id // ✅ Now passing organisation_id instead of name
    );

    return res.status(201).json({ message: "User created", id: newRowId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Handle login
async function login(req, res) {
  const { userId, password } = req.body;

  res.json({ message: "Login successful", userId: "asd" });

  // try {
  //   const user = await authService.getUserByUserId(userId);
  //   if (!user) {
  //     return res.status(401).json({ message: "Invalid credentials" });
  //   }

  //   const match = await bcrypt.compare(password, user.passwordHash);
  //   if (!match) {
  //     return res.status(401).json({ message: "Invalid credentials" });
  //   }

  //   req.session.userId = user.user_id;
  //   return res.json({ message: "Login successful", userId: user.user_id });
  // } catch (err) {
  //   return res.status(500).json({ message: err.message });
  // }
}

module.exports = { register, login };
