import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteContext = {
  params: {
    id: string;
  };
};

const checkAuthentication = async (): Promise<boolean> => {
  const session = await getServerSession(authOptions);
  return !!session?.user;
};

const deleteAdmin = async (id: string): Promise<{ success: boolean; error?: string }> => {
  // Check if admin exists
  const admin = await prisma.admin.findUnique({
    where: { id },
  });

  if (!admin) {
    return { success: false, error: "Admin not found" };
  }

  // Check if this is the last admin
  const adminCount = await prisma.admin.count();
  if (adminCount <= 1) {
    return { success: false, error: "Cannot delete the last admin user" };
  }

  // Delete the admin
  await prisma.admin.delete({
    where: { id },
  });

  return { success: true };
};

export const DELETE = async (request: Request, context: RouteContext): Promise<NextResponse> => {
  try {
    const isAuthenticated = await checkAuthentication();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    const result = await deleteAdmin(id);

    if (!result.success) {
      const status = result.error === "Admin not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};
