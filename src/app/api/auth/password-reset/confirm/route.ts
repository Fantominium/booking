import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

const confirmSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const validateToken = async (token: string): Promise<{ valid: boolean; email?: string }> => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { valid: false };
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    return { valid: false };
  }

  // Check if token was already used
  if (resetToken.usedAt !== null) {
    return { valid: false };
  }

  return { valid: true, email: resetToken.email };
};

const resetPassword = async (email: string, newPassword: string): Promise<void> => {
  const passwordHash = await hashPassword(newPassword);

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    prisma.admin.update({
      where: { email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.updateMany({
      where: { email },
      data: { usedAt: new Date() },
    }),
  ]);
};

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { token, newPassword } = parsed.data;

    // Validate token
    const validation = await validateToken(token);
    if (!validation.valid || !validation.email) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Reset password
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (resetToken) {
      await resetPassword(validation.email, newPassword);
    }

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};
