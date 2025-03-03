const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

/**
 * Registers a new user.
 */
async function registerUser(
  userId,
  email,
  plainPassword,
  roleName,
  organisation_id
) {
  try {
    console.log("Registering user with role:", roleName);

    // Convert role to uppercase to match ENUM values
    roleName = roleName.toUpperCase();

    // ✅ Validate `organisation_id`
    if (!organisation_id) {
      throw new Error("Organisation ID is required.");
    }

    // ✅ Validate `organisation` exists
    const organisation = await prisma.organisation.findUnique({
      where: { organisation_id },
    });

    if (!organisation) {
      throw new Error("Organisation not found.");
    }

    // ✅ Find the `role_id` based on role name
    const role = await prisma.role.findUnique({
      where: { name: roleName }, // Ensure `name` is unique in the `Role` table
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found.`);
    }

    // ✅ Hash the password
    const passwordHash = bcrypt.hashSync(plainPassword, 10);

    // ✅ Create the user with `role_id` and `organisation_id`
    const newUser = await prisma.user.create({
      data: {
        user_id: userId,
        email,
        password_hash: passwordHash,
        role_id: role.role_id, // ✅ Now connecting via `role_id`
        organisation_id, // ✅ Connecting via `organisation_id`
      },
    });

    console.log("✅ New user created:", newUser);
    return newUser.user_id;
  } catch (error) {
    console.error("❌ Error registering user:", error.message);
    throw new Error("Error inserting user: " + error.message);
  }
}

module.exports = { registerUser };
