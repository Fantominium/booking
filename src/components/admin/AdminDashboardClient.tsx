"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface AdminDashboardClientProps {
  bookings: Array<{
    id: string;
    customerName: string;
    startTime: string;
    status: string;
    service: {
      name: string;
    };
  }>;
  unpaidBalances: Array<{
    id: string;
    customerName: string;
    remainingBalanceCents: number;
    service: {
      name: string;
    };
  }>;
  todayFormatted: string;
  emailFailures?: AttentionBooking[];
  transferReviews?: AttentionBooking[];
  expiredTransfers?: AttentionBooking[];
}

type AttentionBooking = {
  id: string;
  customerName: string;
  startTime: string;
  serviceName: string;
  reviewGraceExpiresAt: string | null;
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Barbados",
  });

type AttentionKind = "review" | "expired" | "email";

const describeAttention = (kind: AttentionKind, item: AttentionBooking): string => {
  if (kind === "review") {
    return `Will be released${
      item.reviewGraceExpiresAt ? ` after ${formatDateTime(item.reviewGraceExpiresAt)}` : ""
    } unless reconciled or cancelled`;
  }
  if (kind === "expired") {
    return `Booked for ${formatDateTime(item.startTime)}; slot released`;
  }
  return `Booking ${formatDateTime(item.startTime)}; resend from Bookings`;
};

const AttentionList = (props: {
  heading: string;
  emptyMessage: string;
  items: AttentionBooking[];
  kind: AttentionKind;
  testId: string;
}): React.ReactElement => (
  <div data-testid={props.testId}>
    <h3 className="text-foreground mb-3 text-sm font-semibold">{props.heading}</h3>
    {props.items.length === 0 ? (
      <p
        role="status"
        className="dark:bg-surface rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-slate-700 dark:text-slate-200"
      >
        {props.emptyMessage}
      </p>
    ) : (
      <ul className="space-y-2">
        {props.items.map((item) => (
          <li
            key={item.id}
            className="border-gold-200 bg-gold-50 dark:border-gold-500/30 dark:bg-gold-500/15 rounded-lg border p-3 text-sm"
          >
            <span className="text-gold-900 font-medium dark:text-slate-100">
              {item.customerName} · {item.serviceName}
            </span>
            <span className="text-gold-700 block dark:text-slate-300">{describeAttention(props.kind, item)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export function AdminDashboardClient({
  bookings,
  unpaidBalances,
  todayFormatted,
  emailFailures = [],
  transferReviews = [],
  expiredTransfers = [],
}: AdminDashboardClientProps): React.ReactElement {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2 text-neutral-600 dark:text-slate-300">
          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-dashboard">
        <header className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold">Dashboard</h1>
          <p className="text-neutral-600 dark:text-slate-200">
            Review today&apos;s schedule and pending actions.
          </p>
        </header>

        <section className="border-border bg-surface-elevated rounded-lg border p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-foreground text-xl font-semibold">Today&apos;s Schedule</h2>
            <p className="text-sm text-neutral-500 dark:text-slate-300">{todayFormatted}</p>
          </div>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="dark:bg-surface rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-slate-700">
                <span className="mb-2 block text-2xl">📅</span>
                <p className="text-sm text-blue-700 dark:text-slate-200">
                  No bookings scheduled today.
                </p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border-border bg-surface flex flex-col space-y-2 rounded-lg border p-4 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  <div className="text-foreground font-semibold">
                    {booking.customerName} · {booking.service.name}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600 dark:text-slate-300">
                    <span>
                      {new Date(booking.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        booking.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
                          : booking.status === "PENDING"
                            ? "bg-gold-100 text-gold-800 dark:bg-gold-500/20 dark:text-gold-100"
                            : "bg-neutral-100 text-neutral-800 dark:bg-slate-700 dark:text-slate-100"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border-border bg-surface-elevated rounded-lg border p-6 shadow-sm">
          <h2 className="text-foreground mb-4 text-xl font-semibold">Pending Actions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">Unpaid Balances</h3>
              {unpaidBalances.length === 0 ? (
                <div className="dark:bg-surface rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-slate-700">
                  <span className="mb-2 block text-2xl">✅</span>
                  <p className="text-sm text-green-700 dark:text-slate-200">
                    No outstanding balances.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unpaidBalances.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-gold-200 bg-gold-50 dark:border-gold-500/30 dark:bg-gold-500/15 flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="text-sm">
                        <span className="text-gold-900 font-medium dark:text-slate-100">
                          {booking.customerName}
                        </span>
                        <span className="text-gold-700 dark:text-slate-300">
                          {" "}
                          · {booking.service.name}
                        </span>
                      </div>
                      <span className="text-gold-900 font-semibold dark:text-slate-100">
                        ${(booking.remainingBalanceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AttentionList
              testId="transfer-reviews"
              heading="Bank Transfers Awaiting Review"
              emptyMessage="No transfers are awaiting review."
              items={transferReviews}
              kind="review"
            />

            <AttentionList
              testId="expired-transfers"
              heading="Recently Expired Reservations"
              emptyMessage="No reservations expired in the last 7 days."
              items={expiredTransfers}
              kind="expired"
            />

            <AttentionList
              testId="email-failures"
              heading="Email Failures"
              emptyMessage="No email delivery failures recorded."
              items={emailFailures}
              kind="email"
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
