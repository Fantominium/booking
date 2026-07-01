"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  getDefaultServiceDurationOption,
  getServiceDurationOptions,
  type ServiceDurationContext,
  type ServiceDurationOption,
} from "@/lib/service-duration-options";
import type { CardMediaType, HeroMediaType, OfferingType } from "@/types/service";

type ServiceCardService = ServiceDurationContext & {
  id: string;
  name: string;
  description: string | null;
  offeringType: OfferingType;
  heroMediaType?: HeroMediaType | null;
  heroMediaUrl?: string | null;
  heroMediaAltText?: string | null;
  heroPosterUrl?: string | null;
  cardMediaType?: CardMediaType | null;
  cardMediaUrl?: string | null;
  cardMediaAltText?: string | null;
  isDecorative?: boolean | null;
  isActive: boolean;
};

type ServiceCardOptionSelectorProps = {
  service: ServiceCardService;
};

export const ServiceCardOptionSelector = ({
  service,
}: ServiceCardOptionSelectorProps): JSX.Element => {
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
    <>
      <div className="flex flex-1 flex-col gap-4 px-6 pb-4">
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
                    ? "border-slate-900 bg-slate-900 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-slate-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
                }`}
                aria-pressed={isSelected}
                disabled={durationOptions.length === 1}
              >
                {option.durationMin} min
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end text-sm font-medium text-slate-800 dark:text-slate-100">
          <span data-testid="service-price">${(selectedOption.priceCents / 100).toFixed(0)} Bds</span>
        </div>
      </div>

      <Link
        href={`/book/${service.id}?durationMin=${selectedOption.durationMin}`}
        aria-label={`${ctaLabel} ${service.name}`}
        className="mx-6 mt-auto mb-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 dark:bg-blue-300 dark:text-slate-950 dark:hover:bg-blue-200 dark:focus-visible:outline-blue-300"
      >
        {ctaLabel}
      </Link>
    </>
  );
};
