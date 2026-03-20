# TruFlow Booking

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Type Checking

```bash
pnpm typecheck
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

This project uses Vitest for unit and integration tests, and Playwright for end-to-end tests.

### Running Tests

```bash
# Run all unit and integration tests
pnpm test

# Run TypeScript type checks
pnpm typecheck

# Run tests in watch mode
pnpm test:watch

# Run end-to-end tests
pnpm test:e2e
```

### Test Configuration

- **Unit & Integration Tests**: Vitest with Happy DOM (for better ESM support)
- **E2E Tests**: Playwright
- **Config Files**:
  - `vitest.config.mts` - Vitest configuration
  - `playwright.config.ts` - Playwright configuration

  ## Environment Variables

  Create `.env.local` with the following keys:

  ```dotenv
  DATABASE_URL=
  STRIPE_SECRET_KEY=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_WEBHOOK_SECRET=
  RESEND_API_KEY=
  NEXTAUTH_SECRET=
  WEBHOOK_URL_TOKEN=
  REDIS_URL=
  NEXT_PUBLIC_API_URL=
  ```

## Container Runtime

Container scaffolding for the web app, worker, PostgreSQL, and Redis is available for the platform-overhaul path.

```bash
docker compose --env-file .env.compose.example up --build
```

Health endpoint:

```bash
curl http://localhost:3000/api/health
```

See the detailed planning and runtime docs in [docs/overhaul/LOCAL_DEVELOPMENT_BOOTSTRAP.md](docs/overhaul/LOCAL_DEVELOPMENT_BOOTSTRAP.md), [docs/overhaul/GITHUB_ACTIONS_PIPELINE_PLAN.md](docs/overhaul/GITHUB_ACTIONS_PIPELINE_PLAN.md), and [docs/overhaul/CONTAINER_RUNTIME_TOPOLOGY_PLAN.md](docs/overhaul/CONTAINER_RUNTIME_TOPOLOGY_PLAN.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
