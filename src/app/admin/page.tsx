import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

// Force dynamic rendering for admin pages that use database queries
export const dynamic = "force-dynamic";

const startOfTodayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const AdminDashboardPage = async (): Promise<JSX.Element> => {
  const today = startOfTodayUtc();
  const tomorrow = addDays(today, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  const unpaidBalances = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      remainingBalanceCents: { gt: 0 },
    },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  // Format data for client component
  const bookingsData = bookings.map((booking) => ({
    id: booking.id,
    customerName: booking.customerName,
    startTime: booking.startTime.toISOString(),
    status: booking.status,
    service: {
      name: booking.service.name,
    },
  }));

  const unpaidBalancesData = unpaidBalances.map((booking) => ({
    id: booking.id,
    customerName: booking.customerName,
    remainingBalanceCents: booking.remainingBalanceCents,
    service: {
      name: booking.service.name,
    },
  }));

  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AdminDashboardClient
      bookings={bookingsData}
      unpaidBalances={unpaidBalancesData}
      todayFormatted={todayFormatted}
    />
  );
};

export default AdminDashboardPage;
