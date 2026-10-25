import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, redirect } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  redirect: vi.fn((target: string) => {
    throw new Error(`REDIRECT:${target}`);
  }),
}));

vi.mock("next-auth", () => ({ getServerSession, default: () => vi.fn() }));
vi.mock("next-auth/providers/credentials", () => ({ default: (config: unknown) => config }));
vi.mock("next/navigation", () => ({ redirect, notFound: vi.fn() }));
vi.mock("@/lib/config/env", () => ({ env: { NEXTAUTH_SECRET: "test-secret" } }));
vi.mock("@/lib/middleware/rate-limit", () => ({ publicRateLimitResponse: vi.fn() }));
// Empty doubles: any data access before the auth gate passes throws and fails the 401 assertion.
vi.mock("@/lib/queue/config", () => ({
  emailQueue: {},
  maintenanceQueue: {},
  redisConnection: {},
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const apiRoot = join(process.cwd(), "src/app/api/admin");
const pageRoot = join(process.cwd(), "src/app/admin");

const walk = (dir: string, file: string): string[] =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name === file)
    .map((entry) => join(entry.parentPath, entry.name));

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const routeFiles = walk(apiRoot, "route.ts");
const pageFiles = walk(pageRoot, "page.tsx").filter((file) => !file.includes(`${sep}login${sep}`));

const wrongSessions = {
  anonymous: null,
  "customer role": { user: { id: "u1", role: "customer" } },
  "role-less session": { user: { id: "u1" } },
  "id-less admin": { user: { role: "admin" } },
};

describe("admin API deny-by-default", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("discovers the admin route inventory", () => {
    expect(routeFiles.length).toBeGreaterThanOrEqual(16);
  });

  describe.each(routeFiles.map((file) => [relative(process.cwd(), file), file] as const))(
    "%s",
    (_name, file) => {
      describe.each(Object.entries(wrongSessions))("with %s", (_label, session) => {
        it("returns 401 for every exported method before touching data", async () => {
          const routeModule = (await import(/* @vite-ignore */ file)) as Record<string, unknown>;
          const exported = methods.filter(
            (method) => typeof Reflect.get(routeModule, method) === "function",
          );
          expect(exported.length).toBeGreaterThan(0);

          for (const method of exported) {
            getServerSession.mockResolvedValue(session);
            const handler = Reflect.get(routeModule, method) as (
              request: Request,
              context: unknown,
            ) => Promise<Response>;
            const response = await handler(
              new Request("http://localhost/api/admin/x?id=1", {
                method,
                headers: { "content-type": "application/json" },
                body: method === "GET" || method === "DELETE" ? undefined : "{}",
              }),
              { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }) },
            );

            expect(response.status, `${method} ${file}`).toBe(401);
          }
        });
      });
    },
  );
});

describe("admin API with a valid admin session", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it.each(routeFiles.map((file) => [relative(process.cwd(), file), file] as const))(
    "%s passes the auth gate (never 401)",
    async (_name, file) => {
      const routeModule = (await import(/* @vite-ignore */ file)) as Record<string, unknown>;
      getServerSession.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });

      for (const method of methods.filter(
        (name) => typeof Reflect.get(routeModule, name) === "function",
      )) {
        const handler = Reflect.get(routeModule, method) as (
          request: Request,
          context: unknown,
        ) => Promise<Response>;
        // Data access is stubbed out, so a handler past the gate may throw or return a non-401 error.
        const status = await handler(
          new Request("http://localhost/api/admin/x", {
            method,
            body: method === "GET" ? undefined : "{}",
          }),
          { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }) },
        ).then(
          (response) => response.status,
          () => 0,
        );
        expect(status, `${method} ${file}`).not.toBe(401);
      }
    },
  );
});

describe("admin pages deny-by-default", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("discovers the admin page inventory", () => {
    expect(pageFiles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(pageFiles.map((file) => [relative(process.cwd(), file), file] as const))(
    "%s redirects anonymous and non-admin sessions to login",
    async (_name, file) => {
      const pageModule = (await import(/* @vite-ignore */ file)) as {
        default: (props: unknown) => Promise<unknown>;
      };

      for (const session of Object.values(wrongSessions)) {
        getServerSession.mockResolvedValue(session);
        await expect(
          pageModule.default({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }),
        ).rejects.toThrow(/REDIRECT:\/admin\/login/);
      }
    },
  );
});
