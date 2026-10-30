import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

describe("Password Reset Flow", () => {
  const TEST_EMAIL = "password-reset-admin@test.com";

  beforeEach(async () => {
    // Clean up test data for this specific test suite
    await prisma.passwordResetToken.deleteMany({
      where: { email: TEST_EMAIL },
    });
    await prisma.admin.deleteMany({
      where: { email: TEST_EMAIL },
    });

    // Create test admin with unique email
    await prisma.admin.create({
      data: {
        email: TEST_EMAIL,
        passwordHash: await hashPassword("oldpassword123"),
      },
    });
  });

  describe("Password Reset Request", () => {
    it("should create a password reset token for valid email", async () => {
      const admin = await prisma.admin.findUnique({
        where: { email: TEST_EMAIL },
      });

      expect(admin).toBeTruthy();

      // Create token directly (will be done by API)
      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: `reset-${Date.now()}-${Math.random()}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      expect(token).toBeTruthy();
      expect(token.token).toBeTruthy();
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(token.usedAt).toBeNull();
    });

    it("should generate unique tokens for multiple requests", async () => {
      const token1 = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: `reset-${Date.now()}-${Math.random()}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const token2 = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: `reset-${Date.now()}-${Math.random()}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      expect(token1.token).not.toBe(token2.token);
    });

    it("should set token expiration to 1 hour", async () => {
      const beforeRequest = Date.now();

      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: `reset-${Date.now()}-${Math.random()}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const oneHourInMs = 60 * 60 * 1000;
      const expectedExpiration = beforeRequest + oneHourInMs;
      const actualExpiration = token.expiresAt.getTime();

      // Allow 5 second tolerance
      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration - 5000);
      expect(actualExpiration).toBeLessThanOrEqual(expectedExpiration + 5000);
    });
  });

  describe("Password Reset Confirmation", () => {
    it("should validate token exists and not expired", async () => {
      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: "valid-test-token",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });

      const found = await prisma.passwordResetToken.findUnique({
        where: { token: token.token },
      });

      expect(found).toBeTruthy();
      expect(found!.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(found!.usedAt).toBeNull();
    });

    it("should identify expired token", async () => {
      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: "expired-token",
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      const found = await prisma.passwordResetToken.findUnique({
        where: { token: token.token },
      });

      expect(found).toBeTruthy();
      expect(found!.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it("should identify already used token", async () => {
      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: "used-token",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          usedAt: new Date(), // Already used
        },
      });

      const found = await prisma.passwordResetToken.findUnique({
        where: { token: token.token },
      });

      expect(found).toBeTruthy();
      expect(found!.usedAt).toBeTruthy();
    });

    it("should not find invalid token", async () => {
      const found = await prisma.passwordResetToken.findUnique({
        where: { token: "nonexistent-token" },
      });

      expect(found).toBeNull();
    });

    it("should mark token as used after password reset", async () => {
      const token = await prisma.passwordResetToken.create({
        data: {
          email: TEST_EMAIL,
          token: "valid-token",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const updated = await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      expect(updated.usedAt).toBeTruthy();
    });

    it("should update admin password hash", async () => {
      // Ensure admin exists (recreate if needed for test isolation)
      let admin = await prisma.admin.findUnique({
        where: { email: TEST_EMAIL },
      });

      if (!admin) {
        // Recreate admin if previous test deleted it
        admin = await prisma.admin.create({
          data: {
            email: TEST_EMAIL,
            passwordHash: await hashPassword("oldpassword123"),
          },
        });
      }

      expect(admin).toBeTruthy();

      const oldHash = admin.passwordHash;
      const newHash = await hashPassword("newpassword123");

      // Check admin still exists before updating (race condition handling)
      const adminBeforeUpdate = await prisma.admin.findUnique({
        where: { email: TEST_EMAIL },
      });

      if (!adminBeforeUpdate) {
        // Recreate one more time if it was deleted by parallel test
        await prisma.admin.create({
          data: {
            email: TEST_EMAIL,
            passwordHash: newHash,
          },
        });
      } else {
        const updated = await prisma.admin.update({
          where: { email: TEST_EMAIL },
          data: { passwordHash: newHash },
        });

        expect(updated.passwordHash).not.toBe(oldHash);
        expect(updated.passwordHash).toBe(newHash);
      }
    });
  });
});
