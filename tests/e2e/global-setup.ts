import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

async function globalSetup(): Promise<void> {
  // Create test admin if it doesn't exist
  const testAdminEmail = "admin@truflow.local";
  const testAdminPassword = "TestPassword123!";

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: testAdminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword(testAdminPassword);
      await prisma.admin.create({
        data: {
          email: testAdminEmail,
          passwordHash,
        },
      });
      console.log(`✓ Created test admin: ${testAdminEmail}`);
    } else {
      console.log(`✓ Test admin already exists: ${testAdminEmail}`);
    }
  } catch (error) {
    console.error("Failed to set up test admin:", error);
    throw error;
  }
}

export default globalSetup;
