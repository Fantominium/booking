import Link from "next/link";

import { OFFERING_LABELS } from "@/lib/offerings";
import type { Service } from "@/types/service";

type ServiceCardProps = {
  service: Service;
};

export const ServiceCard = ({ service }: ServiceCardProps): JSX.Element => {
  const ctaLabel =
    service.offeringType === "EVENT"
      ? "Reserve event"
      : service.offeringType === "RENTAL"
        ? "Reserve rental"
        : "Reserve session";

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="service-card"
    >
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
          {OFFERING_LABELS[service.offeringType]}
        </span>
        <h3 className="text-xl font-semibold text-slate-950" data-testid="service-name">
          {service.name}
        </h3>
        <p className="text-sm leading-6 text-slate-700">{service.description ?? ""}</p>
      </div>
      <div className="flex items-center justify-between text-sm font-medium text-slate-800">
        <span data-testid="service-duration">{service.durationMin} min</span>
        <span data-testid="service-price">${(service.priceCents / 100).toFixed(2)}</span>
      </div>
      <Link
        href={`/book/${service.id}`}
        aria-label={`${ctaLabel} ${service.name}`}
        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
      >
        {ctaLabel}
      </Link>
    </div>
  );
};
