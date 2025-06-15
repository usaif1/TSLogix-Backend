const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const eventLogger = require("../../utils/eventLogger");
require("dotenv").config(); // Load environment variables

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/**
 * Registers a new user.
 */
async function registerUser(loginPayload) {
  const { userId, email, plainPassword, roleName, organisation_id } =
    loginPayload;

  try {
    console.log("Registering user with role:", roleName);

    if (!organisation_id) {
      throw new Error("Organisation ID is required.");
    }

    // Validate organisation existence
    const organisation = await prisma.organisation.findUnique({
      where: { organisation_id },
    });

    if (!organisation) {
      throw new Error("Organisation not found.");
    }

    // Find the role_id based on role name
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found.`);
    }

    // Hash the password
    const passwordHash = bcrypt.hashSync(plainPassword, 10);

    // Create the user with role_id and organisation_id
    const newUser = await prisma.user.create({
      data: {
        user_id: userId,
        email,
        password_hash: passwordHash,
        role_id: role.role_id,
        organisation_id,
      },
    });

    // Log user registration
    await eventLogger.logEvent({
      userId: newUser.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      description: `New user registered: ${newUser.email} with role ${roleName}`,
      newValues: {
        user_id: newUser.user_id,
        email: newUser.email,
        role: roleName,
        organisation_id: newUser.organisation_id
      },
      metadata: {
        operation_type: 'USER_REGISTRATION',
        role: roleName,
        organisation_id: newUser.organisation_id
      }
    });

    console.log("✅ New user created:", newUser);
    return newUser.user_id;
  } catch (error) {
    console.error("❌ Error registering user:", error.message);
    throw new Error("Error inserting user: " + error.message);
  }
}

/**
 * Logs in a user and returns a JWT token.
 */
async function loginUser(userId, plainPassword, ipAddress = null, userAgent = null, sessionId = null) {
  try {
    // ✅ Find user by `userId`
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true }, // Include role to get role name
    });

    if (!user) {
      // Log failed login attempt
      await eventLogger.logEvent({
        userId: 'SYSTEM',
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: userId,
        description: `Failed login attempt for user ID: ${userId} - User not found`,
        metadata: {
          operation_type: 'AUTHENTICATION',
          failure_reason: 'USER_NOT_FOUND',
          attempted_user_id: userId
        },
        ipAddress,
        userAgent,
        sessionId
      });
      throw new Error("Invalid userID or password.");
    }

    // ✅ Verify password
    const isPasswordValid = bcrypt.compareSync(
      plainPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      // Log failed login attempt
      await eventLogger.logEvent({
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        description: `Failed login attempt for user: ${user.email} - Invalid password`,
        metadata: {
          operation_type: 'AUTHENTICATION',
          failure_reason: 'INVALID_PASSWORD',
          user_email: user.email,
          role: user.role.name
        },
        ipAddress,
        userAgent,
        sessionId
      });
      throw new Error("Invalid userID or password.");
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role.name, // Attach role name in the token
        organisation_id: user.organisation_id,
        id: user.id,
      },
      SECRET_KEY
    );

    // Log successful login
    await eventLogger.logEvent({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `User logged in successfully: ${user.email}`,
      newValues: {
        login_time: new Date().toISOString(),
        role: user.role.name,
        organisation_id: user.organisation_id
      },
      metadata: {
        operation_type: 'AUTHENTICATION',
        login_method: 'PASSWORD',
        user_email: user.email,
        role: user.role.name,
        organisation_id: user.organisation_id
      },
      ipAddress,
      userAgent,
      sessionId
    });

    return { token, role: user.role.name, organisation_id: user.organisation_id, id: user.id };
  } catch (error) {
    console.error("❌ Error logging in:", error.message);
    throw new Error("Login failed: " + error.message);
  }
}

module.exports = { registerUser, loginUser };
