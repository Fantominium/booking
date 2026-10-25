import { describe, expect, it } from "vitest";

import {
  assertDestructiveSeedAllowed,
  assertE2EDatabaseIsolated,
} from "@/lib/config/production-safety";

describe("destructive seed safety", () => {
  it("allows an explicitly local development database", () => {
    expect(() =>
      assertDestructiveSeedAllowed({
        nodeEnv: "development",
        databaseUrl: "postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev",
      }),
    ).not.toThrow();
    expect(() =>
      assertDestructiveSeedAllowed({
        nodeEnv: undefined,
        databaseUrl: "postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev",
      }),
    ).not.toThrow();
    expect(() =>
      assertDestructiveSeedAllowed({
        nodeEnv: "test",
        databaseUrl: "postgresql://postgres:postgres@localhost:5432/truflow_booking_ci",
      }),
    ).not.toThrow();
  });

  it.each([
    {
      nodeEnv: "production",
      databaseUrl: "postgresql://app:secret@localhost:5432/truflow_booking_dev",
    },
    {
      nodeEnv: "development",
      databaseUrl: "postgresql://app:secret@db.internal:5432/truflow_booking_dev",
    },
    {
      nodeEnv: "development",
      databaseUrl: "postgresql://app:secret@localhost:5432/truflow_booking",
    },
  ])("refuses non-isolated target $databaseUrl", (environment) => {
    expect(() => assertDestructiveSeedAllowed(environment)).toThrow(
      "Destructive seed is restricted to local development or test databases",
    );
  });

  it("allows destructive E2E setup only on a local database explicitly named test", () => {
    expect(() =>
      assertE2EDatabaseIsolated(
        "postgresql://postgres:devpassword@localhost:5432/truflow_booking_test",
      ),
    ).not.toThrow();
    expect(() =>
      assertE2EDatabaseIsolated(
        "postgresql://postgres:devpassword@localhost:5432/truflow_booking_dev",
      ),
    ).toThrow("E2E setup requires an isolated local test database");
    expect(() =>
      assertE2EDatabaseIsolated("postgresql://app:secret@db.internal:5432/truflow_booking_test"),
    ).toThrow("E2E setup requires an isolated local test database");
  });
});
