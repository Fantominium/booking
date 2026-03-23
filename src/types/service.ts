export type OfferingType = "SESSION" | "EVENT" | "RENTAL";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  offeringType: OfferingType;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  isActive: boolean;
};
