import type { OfferingType } from "@/types/service";

export type ServiceDurationContext = {
  offeringType: OfferingType;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
};

export type ServiceDurationOption = {
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
};

const CUSTOM_SHORT_SESSION_PRICE_CENTS = 15000;
const CUSTOM_EXTENDED_SHORT_SESSION_PRICE_CENTS = 16500;

const roundToNearestDollarCents = (amountCents: number): number => {
  return Math.round(amountCents / 100) * 100;
};

const toOptionWithRatio = (
  base: ServiceDurationContext,
  durationMin: number,
  priceCents: number,
): ServiceDurationOption => {
  if (durationMin === base.durationMin && priceCents === base.priceCents) {
    return {
      durationMin,
      priceCents,
      downpaymentCents: Math.min(base.downpaymentCents, priceCents),
    };
  }

  const ratio = base.priceCents > 0 ? base.downpaymentCents / base.priceCents : 0;
  return {
    durationMin,
    priceCents,
    downpaymentCents: Math.min(Math.round(priceCents * ratio), priceCents),
  };
};

export const getServiceDurationOptions = (
  service: ServiceDurationContext,
): ServiceDurationOption[] => {
  if (service.offeringType !== "SESSION") {
    return [
      {
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        downpaymentCents: service.downpaymentCents,
      },
    ];
  }

  if (service.durationMin >= 50 && service.durationMin < 60) {
    return [
      toOptionWithRatio(service, 50, CUSTOM_SHORT_SESSION_PRICE_CENTS),
      toOptionWithRatio(service, 65, CUSTOM_EXTENDED_SHORT_SESSION_PRICE_CENTS),
    ];
  }

  if (service.durationMin === 60) {
    return [
      toOptionWithRatio(service, 60, service.priceCents),
      toOptionWithRatio(service, 75, roundToNearestDollarCents(service.priceCents * 1.1)),
      toOptionWithRatio(service, 85, roundToNearestDollarCents(service.priceCents * 1.13)),
    ];
  }

  return [
    {
      durationMin: service.durationMin,
      priceCents: service.priceCents,
      downpaymentCents: service.downpaymentCents,
    },
  ];
};

export const getDefaultServiceDurationOption = (
  service: ServiceDurationContext,
): ServiceDurationOption => {
  const options = getServiceDurationOptions(service);
  const sorted = [...options].sort((a, b) => a.durationMin - b.durationMin);
  return sorted[0];
};

export const resolveServiceDurationOption = (
  service: ServiceDurationContext,
  requestedDurationMin?: number,
): ServiceDurationOption => {
  const options = getServiceDurationOptions(service);

  if (typeof requestedDurationMin === "number") {
    const exact = options.find((option) => option.durationMin === requestedDurationMin);
    if (exact) {
      return exact;
    }
  }

  return getDefaultServiceDurationOption(service);
};
