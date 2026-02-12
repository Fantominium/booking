import { prisma } from "@/lib/prisma";

const SuccessPage = async ({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}): Promise<JSX.Element> => {
  const bookingId = searchParams.bookingId;

  if (!bookingId) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 bg-slate-50 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Booking confirmed</h1>
        <p className="text-slate-700">We could not find booking details.</p>
      </main>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 bg-slate-50 px-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Booking confirmed</h1>
      {booking ? (
        <div className="rounded-lg border border-slate-300 bg-white p-6 text-slate-800">
          <p className="font-semibold">{booking.service.name}</p>
          <p>{booking.customerName}</p>
          <p>{booking.startTime.toISOString()}</p>
          <p>Status: {booking.status}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
            <p>A calendar invite has been emailed to you.</p>
            <a href={`/api/bookings/${booking.id}/ics`} className="text-slate-900 underline">
              Download calendar file
            </a>
          </div>
        </div>
      ) : (
        <p className="text-slate-700">We could not find booking details.</p>
      )}
    </main>
  );
};

export default SuccessPage;
