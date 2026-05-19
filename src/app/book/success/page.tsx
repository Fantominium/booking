import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const formatMoney = (amountCents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
};

const SuccessPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ bookingId?: string }>;
}): Promise<JSX.Element> => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const bookingId = resolvedSearchParams?.bookingId;

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.22),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Booking confirmed</h1>
          <p className="text-slate-700 dark:text-slate-200">We could not find booking details.</p>
        </main>
      </div>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  const settings = await prisma.systemSettings.findFirst();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.22),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          {booking?.paymentMethod === "BANK_TRANSFER" ? "Reservation received" : "Booking received"}
        </h1>
        {booking ? (
          <div className="dark:bg-surface-elevated rounded-2xl border border-slate-300 bg-white p-6 text-slate-800 shadow-sm dark:border-slate-700 dark:text-slate-100">
            <p className="font-semibold">{booking.service.name}</p>
            <p>{booking.customerName}</p>
            <p>{booking.startTime.toISOString()}</p>
            <p>Status: {booking.status}</p>
            <p>
              Payment state:{" "}
              {booking.paymentState === "PENDING_BANK_TRANSFER"
                ? "Awaiting bank transfer"
                : booking.paymentState}
            </p>
            <p>Remaining balance: {formatMoney(booking.remainingBalanceCents)}</p>

            {booking.paymentMethod === "BANK_TRANSFER" ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-slate-100">
                <p className="font-semibold">Bank transfer instructions</p>
                <p className="mt-2 whitespace-pre-line">
                  {settings?.bankTransferInstructions ??
                    "Bank transfer details will be shared by the TruFlow team."}
                </p>
                <p className="mt-2 font-semibold">
                  Reference: {booking.bankTransferReference ?? booking.id}
                </p>
                <p className="mt-2">
                  Your reservation is held in a pending payment state until the transfer is
                  received.
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
              <p>
                {booking.paymentMethod === "BANK_TRANSFER"
                  ? "Once payment is received, TruFlow will confirm the reservation and send final details."
                  : "A calendar invite has been emailed to you."}
              </p>
              <a
                href={`/api/bookings/${booking.id}/ics`}
                className="text-slate-900 underline dark:text-blue-200"
              >
                Download calendar file
              </a>
            </div>
          </div>
        ) : (
          <p className="text-slate-700 dark:text-slate-200">We could not find booking details.</p>
        )}
      </main>
    </div>
  );
};

export default SuccessPage;
