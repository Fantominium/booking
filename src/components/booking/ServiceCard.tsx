"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { OFFERING_LABELS } from "@/lib/offerings";
import {
  getDefaultServiceDurationOption,
  getServiceDurationOptions,
  type ServiceDurationOption,
} from "@/lib/service-duration-options";
import type { Service } from "@/types/service";

type ServiceCardProps = {
  service: Service;
};

export const ServiceCard = ({ service }: ServiceCardProps): JSX.Element => {
  const durationOptions = useMemo(() => getServiceDurationOptions(service), [service]);
  const defaultOption = useMemo(() => getDefaultServiceDurationOption(service), [service]);
  const [selectedOption, setSelectedOption] = useState<ServiceDurationOption>(defaultOption);

  const handleDurationSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const durationValue = Number.parseInt(event.currentTarget.dataset.duration ?? "", 10);
      if (Number.isNaN(durationValue)) {
        return;
      }

      const nextOption = durationOptions.find((option) => option.durationMin === durationValue);
      if (!nextOption) {
        return;
      }

      setSelectedOption(nextOption);
    },
    [durationOptions],
  );

  let ctaLabel = "Reserve session";
  if (service.offeringType === "EVENT") {
    ctaLabel = "Reserve event";
  }
  if (service.offeringType === "RENTAL") {
    ctaLabel = "Reserve rental";
  }

  return (
    <div
      className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="service-card"
    >
      <div className="flex flex-1 flex-col gap-3">
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
          {OFFERING_LABELS[service.offeringType]}
        </span>
        <h3 className="min-h-14 text-xl font-semibold text-slate-950" data-testid="service-name">
          {service.name}
        </h3>
        <p className="min-h-18 text-sm leading-6 text-slate-700">{service.description ?? ""}</p>

        <div
          className="flex min-h-8 flex-wrap items-start gap-2"
          aria-label={`${service.name} duration options`}
        >
          {durationOptions.map((option) => {
            const isSelected = option.durationMin === selectedOption.durationMin;
            return (
              <button
                key={`${service.id}-${option.durationMin}`}
                type="button"
                data-duration={option.durationMin}
                onClick={handleDurationSelect}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
                aria-pressed={isSelected}
                disabled={durationOptions.length === 1}
              >
                {option.durationMin} min
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end text-sm font-medium text-slate-800">
        <span data-testid="service-price">${(selectedOption.priceCents / 100).toFixed(2)}</span>
      </div>
      <Link
        href={`/book/${service.id}?durationMin=${selectedOption.durationMin}`}
        aria-label={`${ctaLabel} ${service.name}`}
        className="mt-auto inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
      >
        {ctaLabel}
      </Link>
    </div>
  );
};
