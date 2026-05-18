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
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase">
          {OFFERING_LABELS[service.offeringType]}
        </span>
        <h1 className="text-3xl font-bold text-slate-950">{service.name}</h1>
        <p className="text-slate-700">{service.description ?? ""}</p>
        <div className="text-sm font-medium text-slate-800">
          {selectedOption.durationMin} minutes · ${(selectedOption.priceCents / 100).toFixed(2)}
        </div>
      </header>
      <BookingFlow
        serviceId={service.id}
        selectedDurationMin={selectedOption.durationMin}
        selectedPriceCents={selectedOption.priceCents}
      />
    </main>
  );
};

export default ServiceBookingPage;
