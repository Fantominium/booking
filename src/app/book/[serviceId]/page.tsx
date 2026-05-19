import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { OFFERING_LABELS } from "@/lib/offerings";
import { prisma } from "@/lib/prisma";
import { resolveServiceDurationOption } from "@/lib/service-duration-options";

export const dynamic = "force-dynamic";

const ServiceBookingPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>;
  searchParams?: Promise<{ durationMin?: string }>;
}): Promise<JSX.Element> => {
  const { serviceId } = await params;
  const resolvedSearchParams = await searchParams;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    notFound();
  }

  const requestedDuration = Number.parseInt(resolvedSearchParams?.durationMin ?? "", 10);
  const selectedOption = resolveServiceDurationOption(
    service,
    Number.isNaN(requestedDuration) ? undefined : requestedDuration,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.22),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <span className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase dark:text-slate-300">
            {OFFERING_LABELS[service.offeringType]}
          </span>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{service.name}</h1>
          <p className="text-slate-700 dark:text-slate-200">{service.description ?? ""}</p>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {selectedOption.durationMin} minutes · ${(selectedOption.priceCents / 100).toFixed(2)}
          </div>
        </header>
        <BookingFlow
          serviceId={service.id}
          selectedDurationMin={selectedOption.durationMin}
          selectedPriceCents={selectedOption.priceCents}
        />
      </main>
    </div>
  );
};

export default ServiceBookingPage;
