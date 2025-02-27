// src/modules/authentication/auth.service.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Register a new user
async function registerUser(userId, plainPassword, role, organization) {
  const passwordHash = bcrypt.hashSync(plainPassword, 10); // Hash the password

  try {
    const newUser = await prisma.user.create({
      data: {
        userId: userId,
        passwordHash: bcrypt.hashSync(plainPassword, 10),

        // ✅ Fix Role Connection
        role: {
          connectOrCreate: {
            where: { id: 1 }, // Ensure Role ID is used
            create: { name: role.name },
          },
        },

        // ✅ Fix Organization Connection
        organization: {
          connectOrCreate: {
            where: { name: organization.name }, // `name` is now UNIQUE
            create: { name: organization.name },
          },
        },
      },
    });

    console.log("new user", newUser);
    return newUser.id; // Return the new user ID
  } catch (error) {
    throw new Error("Error inserting user: " + error.message);
  }
}

// Fetch user by userId
async function getUserByUserId(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userId,
      },
    });
    return user; // Returns the user object or null
  } catch (error) {
    throw new Error("Error fetching user: " + error.message);
  }
}

module.exports = {
  registerUser,
  getUserByUserId,
};
