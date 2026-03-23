import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const isAdminRole = (role: string | null | undefined): role is "admin" => {
  return role === "admin";
};

export const getAdminSession = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return null;
  }

  return session;
};

export const requireAdminPageSession = async (callbackUrl: string): Promise<Session> => {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
};

export const createAdminUnauthorizedResponse = (): NextResponse => {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
    { status: 401 },
  );
};