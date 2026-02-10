import { ServiceCard } from "@/components/booking/ServiceCard";
import { prisma } from "@/lib/prisma";

const BookPage = async (): Promise<JSX.Element> => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 bg-slate-50 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Book a massage</h1>
        <p className="text-slate-700">Choose a service to continue.</p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </main>
  );
};

export default BookPage;
