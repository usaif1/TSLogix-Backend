// const { PrismaClient, RoleName } = require("@prisma/client");

// const prisma = new PrismaClient();

// async function seedRoles() {
//   try {
//     // Create or update ADMIN role
//     await prisma.role.upsert({
//       where: { name: RoleName.ADMIN },
//       update: {},
//       create: { name: RoleName.ADMIN },
//     });

//     // Create or update CLIENT role
//     await prisma.role.upsert({
//       where: { name: RoleName.CLIENT },
//       update: {},
//       create: { name: RoleName.CLIENT },
//     });

//     console.log("✅ Roles seeded successfully!");
//   } catch (error) {
//     console.error("❌ Error seeding roles:", error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// seedRoles();

const { PrismaClient, RoleName } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedRoles() {
  try {
    await prisma.role.createMany({
      data: [{ name: RoleName.ADMIN }, { name: RoleName.CLIENT }],
      skipDuplicates: true, // ✅ Avoids errors if roles already exist
    });

    console.log("✅ Roles seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
