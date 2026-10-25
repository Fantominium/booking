type SeedEnvironment = {
  nodeEnv: string | undefined;
  databaseUrl: string | undefined;
};

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const assertDestructiveSeedAllowed = ({ nodeEnv, databaseUrl }: SeedEnvironment): void => {
  if (nodeEnv === "production" || (nodeEnv && nodeEnv !== "development" && nodeEnv !== "test")) {
    throw new Error("Destructive seed is restricted to local development or test databases");
  }

  if (!databaseUrl) {
    throw new Error("Destructive seed is restricted to local development or test databases");
  }

  let target: URL;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error("Destructive seed is restricted to local development or test databases");
  }

  const databaseName = decodeURIComponent(target.pathname.slice(1)).toLowerCase();
  const explicitlyIsolatedDatabase = /(^|[_-])(dev|development|test|ci)([_-]|$)/.test(databaseName);

  if (!LOCAL_DATABASE_HOSTS.has(target.hostname) || !explicitlyIsolatedDatabase) {
    throw new Error("Destructive seed is restricted to local development or test databases");
  }
};

export const assertE2EDatabaseIsolated = (databaseUrl: string | undefined): void => {
  if (!databaseUrl) {
    throw new Error("E2E setup requires an isolated local test database");
  }

  let target: URL;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error("E2E setup requires an isolated local test database");
  }

  const databaseName = decodeURIComponent(target.pathname.slice(1)).toLowerCase();
  if (!LOCAL_DATABASE_HOSTS.has(target.hostname) || !/(^|[_-])test([_-]|$)/.test(databaseName)) {
    throw new Error("E2E setup requires an isolated local test database");
  }
};
