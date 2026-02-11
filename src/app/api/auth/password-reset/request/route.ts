import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const generateToken = (): string => {
  return randomBytes(32).toString("hex");
};

const createPasswordResetToken = async (email: string): Promise<string> => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  return token;
};

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email } = parsed.data;

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // Always return same message to prevent email enumeration
    if (admin) {
      const token = await createPasswordResetToken(email);

      // TODO: Queue email with token
      // await emailService.queuePasswordResetEmail(email, token);
      console.log(`Password reset token for ${email}: ${token}`);
    }

    return NextResponse.json({
      message: "If an account exists, a password reset email has been sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};
