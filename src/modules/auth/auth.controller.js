// src/modules/authentication/auth.controller.js
const authService = require("./auth.service");

/**
 * Handle user registration
 */
async function register(req, res) {
  const { loginPayload } = req.body;
  console.log("loginPayload", loginPayload);
  const { userId, email, plainPassword, roleName, organisation_id } =
    loginPayload;

  if (!userId || !email || !plainPassword || !roleName || !organisation_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newRowId = await authService.registerUser(loginPayload);

    return res.status(201).json({ message: "User created", id: newRowId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Handle user login
 */
async function login(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res
      .status(400)
      .json({ message: "userId and password are required" });
  }

  try {
    // Changed variable name from 'res' to 'authResult' to avoid conflict
    const authResult = await authService.loginUser(userId, password);

    console.log("authResult", authResult);

    // Make sure we have all required data from authResult
    const { token, role, organisation_id, id } = authResult;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        role,
        organisation_id,
        id
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(401).json({ 
      success: false,
      message: err.message 
    });
  }
}

module.exports = { register, login };
