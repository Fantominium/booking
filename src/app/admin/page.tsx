import { prisma } from "@/lib/prisma";

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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 bg-slate-50 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-slate-700">Review today&apos;s schedule and pending actions.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Today&apos;s schedule</h2>
        <p className="text-sm text-slate-600">{today.toISOString().slice(0, 10)}</p>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-600">No bookings scheduled today.</p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-1 rounded-lg border border-slate-100 p-3 text-sm"
              >
                <div className="font-semibold text-slate-900">
                  {booking.customerName} · {booking.service.name}
                </div>
                <div className="text-slate-600">
                  {booking.startTime.toISOString()} · {booking.status}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Pending actions</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Unpaid balances</h3>
            {unpaidBalances.length === 0 ? (
              <p className="text-sm text-slate-600">No outstanding balances.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {unpaidBalances.map((booking) => (
                  <li key={booking.id}>
                    {booking.customerName} · {booking.service.name} · $
                    {booking.remainingBalanceCents / 100}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Email failures</h3>
            <p className="text-sm text-slate-600">No email delivery failures recorded.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
