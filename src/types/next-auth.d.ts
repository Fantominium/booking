import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      email?: string | null;
      role?: "admin";
    };
  }

  interface User {
    role?: "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin";
  }
}
