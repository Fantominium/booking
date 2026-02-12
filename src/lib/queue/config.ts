import { Queue } from "bullmq";
import Redis from "ioredis";

import { env } from "@/lib/config/env";

export const redisConnection = new Redis(env.REDIS_URL ?? "");

export const EMAIL_QUEUE_NAME = "email-queue";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});
