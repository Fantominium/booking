import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

async function globalSetup(): Promise<void> {
  // Create test admin if it doesn't exist
  const testAdminEmail = "admin@truflow.local";
  const testAdminPassword =
    process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? process.env.ADMIN_SEED_PASSWORD;

  try {
    await prisma.paymentAuditLog.deleteMany();
    await prisma.booking.deleteMany();

    if (!testAdminPassword) {
      console.warn("Skipping Playwright admin setup because no admin password is configured.");
      return;
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email: testAdminEmail },
    });

    if (existingAdmin) {
      console.log(`✓ Test admin already exists: ${testAdminEmail}`);
      return;
    }

    const passwordHash = await hashPassword(testAdminPassword);
    await prisma.admin.create({
      data: {
        email: testAdminEmail,
        passwordHash,
      },
    });
    console.log(`✓ Created test admin: ${testAdminEmail}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.warn("Skipping Playwright admin setup because the admins table is unavailable in the current database.");
      return;
    }

    console.error("Failed to set up test admin:", error);
    throw error;
  }
}

export default globalSetup;
