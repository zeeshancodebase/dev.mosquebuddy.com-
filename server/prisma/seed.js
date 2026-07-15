import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  {
    name: "registered_user",
    description: "Normal registered Sabeel user",
  },
  {
    name: "mosque_admin",
    description: "Mosque representative who can manage assigned mosque data",
  },
  {
    name: "trusted_volunteer",
    description: "Trusted volunteer who helps verify mosque and timing data",
  },
  {
    name: "super_admin",
    description: "Sabeel core admin with full platform control",
  },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
  }

  console.log("✅ Roles seeded successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });