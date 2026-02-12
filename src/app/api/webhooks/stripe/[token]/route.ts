import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/lib/config/env";
import { prisma } from "@/lib/prisma";
import { logPaymentAudit } from "@/lib/services/audit";
import { confirmBookingStatus } from "@/lib/services/booking";
import { isWebhookEventProcessed } from "@/lib/services/payment";
import { stripe } from "@/lib/stripe/config";

export const POST = async (
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> => {
  const { token } = await context.params;

  if (token !== env.WEBHOOK_URL_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;

    const alreadyHandled = await isWebhookEventProcessed({
      stripeEventId: event.id,
      action: "PAYMENT_CONFIRMED",
    });

    if (alreadyHandled) {
      return NextResponse.json({ received: true });
    }

    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: intent.id },
    });

    if (booking && booking.status !== "CONFIRMED") {
      await confirmBookingStatus({ prisma, bookingId: booking.id });

      await logPaymentAudit({
        bookingId: booking.id,
        action: "PAYMENT_CONFIRMED",
        amountCents: intent.amount,
        outcome: "SUCCESS",
        stripeEventId: event.id,
        stripePaymentIntentId: intent.id,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;

    const alreadyHandled = await isWebhookEventProcessed({
      stripeEventId: event.id,
      action: "PAYMENT_FAILED",
    });

    if (alreadyHandled) {
      return NextResponse.json({ received: true });
    }

    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: intent.id },
    });

    if (booking) {
      await logPaymentAudit({
        bookingId: booking.id,
        action: "PAYMENT_FAILED",
        amountCents: intent.amount,
        outcome: "FAILED",
        stripeEventId: event.id,
        stripePaymentIntentId: intent.id,
      });
    }
  }

  return NextResponse.json({ received: true });
};
