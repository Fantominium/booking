import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { verifyPassword } from "@/lib/auth/password";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        if (!admin) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, admin.passwordHash);

        if (!isValid) {
          return null;
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ token, user }) => {
      const newToken = { ...token };
      if (user) {
        newToken.id = user.id;
      }
      return newToken;
    },
    session: async ({ session, token }) => {
      const newSession = {
        ...session,
        user: session.user
          ? {
              ...session.user,
              id: token.id as string,
            }
          : undefined,
      };
      return newSession;
    },
  },
  cookies: {
    sessionToken: {
      name: "truflow.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
