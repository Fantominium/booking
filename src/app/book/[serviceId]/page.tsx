import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { OFFERING_LABELS } from "@/lib/offerings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ServiceBookingPage = async ({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}): Promise<JSX.Element> => {
  const { serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase">
          {OFFERING_LABELS[service.offeringType]}
        </span>
        <h1 className="text-3xl font-bold text-slate-950">{service.name}</h1>
        <p className="text-slate-700">{service.description ?? ""}</p>
        <div className="text-sm font-medium text-slate-800">
          {service.durationMin} minutes · ${(service.priceCents / 100).toFixed(2)}
        </div>
      </header>
      <BookingFlow serviceId={service.id} />
    </main>
  );
};

export default ServiceBookingPage;
