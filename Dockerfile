FROM node:20-alpine AS base
WORKDIR /app
ARG PNPM_VERSION=8.15.8
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache openssl libc6-compat && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://postgres:devpassword@postgres:5432/truflow_booking_dev?schema=public"
ENV STRIPE_SECRET_KEY="sk_test_placeholder"
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
ENV STRIPE_WEBHOOK_SECRET="whsec_placeholder"
ENV RESEND_API_KEY="re_placeholder"
ENV NEXTAUTH_SECRET="dev_secret"
ENV WEBHOOK_URL_TOKEN="dev_webhook_token"
ENV REDIS_URL="redis://redis:6379"
ENV NEXT_PUBLIC_API_URL="http://localhost:3000"
RUN pnpm exec prisma generate && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache openssl libc6-compat
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
