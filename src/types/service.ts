export type Service = {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  isActive: boolean;
};
