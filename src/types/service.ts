export type OfferingType = "SESSION" | "EVENT" | "RENTAL";

export type ServiceDurationPriceOption = {
  durationMin: number;
  priceCents: number;
};

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  offeringType: OfferingType;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  durationPriceOptions?: ServiceDurationPriceOption[] | null;
  isActive: boolean;
};
