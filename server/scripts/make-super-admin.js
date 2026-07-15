// this page is used to assign super admin role to a user by email. 
// It can be run from command line like this: node scripts/make-super-admin.js admin@example.com

import "../src/config/env.js";

import prisma from "../src/config/prisma.js";

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide user email.");
  console.error("Example: node scripts/make-super-admin.js admin@example.com");
  process.exit(1);
}

const makeSuperAdmin = async () => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    console.error(`❌ User not found with email: ${email}`);
    process.exit(1);
  }

  const superAdminRole = await prisma.role.findUnique({
    where: {
      name: "super_admin",
    },
  });

  if (!superAdminRole) {
    console.error("❌ super_admin role not found. Please run npm run prisma:seed");
    process.exit(1);
  }

  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },
  });

  if (existingUserRole) {
    if (!existingUserRole.isActive) {
      await prisma.userRole.update({
        where: {
          id: existingUserRole.id,
        },
        data: {
          isActive: true,
        },
      });

      console.log(`✅ Super admin role reactivated for: ${email}`);
      return;
    }

    console.log(`✅ User is already super admin: ${email}`);
    return;
  }

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: superAdminRole.id,
      assignedById: user.id,
    },
  });

  console.log(`✅ Super admin role assigned to: ${email}`);
};

makeSuperAdmin()
  .catch((error) => {
    console.error("❌ Failed to make super admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });