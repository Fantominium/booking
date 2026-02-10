import Link from "next/link";

import type { Service } from "@/types/service";

type ServiceCardProps = {
  service: Service;
};

export const ServiceCard = ({ service }: ServiceCardProps): JSX.Element => {
  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-slate-300 bg-white p-6 shadow-sm"
      data-testid="service-card"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900" data-testid="service-name">
          {service.name}
        </h3>
        <p className="text-sm text-slate-700">{service.description ?? ""}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-800">
        <span data-testid="service-duration">{service.durationMin} min</span>
        <span data-testid="service-price">${(service.priceCents / 100).toFixed(2)}</span>
      </div>
      <Link
        href={`/book/${service.id}`}
        aria-label={`Book ${service.name}`}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Book now
      </Link>
    </div>
  );
};
