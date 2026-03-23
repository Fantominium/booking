import { ServiceCard } from "@/components/booking/ServiceCard";
import { OFFERING_DESCRIPTIONS, OFFERING_LABELS } from "@/lib/offerings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BookPageProps = {
  searchParams?: Promise<{ type?: string }>;
};

const BookPage = async ({ searchParams }: BookPageProps): Promise<JSX.Element> => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedType = resolvedSearchParams?.type?.toUpperCase();

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ offeringType: "asc" }, { name: "asc" }],
  });

  const filteredServices =
    selectedType === "SESSION" || selectedType === "EVENT" || selectedType === "RENTAL"
      ? services.filter((service) => service.offeringType === selectedType)
      : services;

  const groupedServices = ["SESSION", "EVENT", "RENTAL"].map((offeringType) => ({
    offeringType,
    services: filteredServices.filter((service) => service.offeringType === offeringType),
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold tracking-[0.18em] text-slate-600 uppercase">
          Booking journeys
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-slate-950">Reserve a session, event, or rental</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-700">
            Every route below leads to a complete booking journey with availability, customer
            details, and payment choice at the end.
          </p>
        </div>
      </header>

      {groupedServices.map(({ offeringType, services: offeringServices }) => {
        if (offeringServices.length === 0) {
          return null;
        }

        return (
          <section key={offeringType} className="flex flex-col gap-5">
            <header className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-slate-950">
                {OFFERING_LABELS[offeringType as keyof typeof OFFERING_LABELS]}s
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-700">
                {
                  OFFERING_DESCRIPTIONS[
                    offeringType as keyof typeof OFFERING_DESCRIPTIONS
                  ]
                }
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {offeringServices.map((service: (typeof offeringServices)[number]) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
};

export default BookPage;
