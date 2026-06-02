export type OfferingType = "SESSION" | "EVENT" | "RENTAL";
export type HeroMediaType = "IMAGE" | "VIDEO";
export type CardMediaType = "IMAGE" | "GIF";

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
