import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const checkAuthentication = async (): Promise<boolean> => {
  const session = await getServerSession(authOptions);
  return !!session?.user;
};

const listAdmins = async (): Promise<
  Array<{
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }>
> => {
  return prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const createAdmin = async (
  email: string,
  password: string,
): Promise<{
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}> => {
  const passwordHash = await hashPassword(password);

  return prisma.admin.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const GET = async (): Promise<NextResponse> => {
  try {
    const isAuthenticated = await checkAuthentication();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await listAdmins();

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("List admins error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};

export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const isAuthenticated = await checkAuthentication();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Check if email already exists
    const existing = await prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 },
      );
    }

    const admin = await createAdmin(email, password);

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};
