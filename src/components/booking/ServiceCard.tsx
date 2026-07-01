import { MediaSurface } from "@/components/booking/MediaSurface";
import { ServiceCardOptionSelector } from "@/components/booking/ServiceCardOptionSelector";
import { OFFERING_LABELS } from "@/lib/offerings";
import { type ServiceDurationContext } from "@/lib/service-duration-options";
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

type ServiceCardProps = {
  service: ServiceCardService;
};

export const ServiceCard = ({ service }: ServiceCardProps): JSX.Element => {
  return (
    <div
      className="dark:bg-surface-elevated flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700"
      data-testid="service-card"
    >
      <div className="relative min-h-52">
        <MediaSurface
          mediaType={service.cardMediaType}
          mediaUrl={service.cardMediaUrl}
          altText={service.cardMediaAltText}
          isDecorative={service.isDecorative}
          className="h-52 w-full object-cover"
          testId="service-card-media"
        />
        <div className="absolute inset-0 bg-linear-to-t from-white via-white/70 to-black/35 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-950/35" />
        <div className="card-media-fade absolute right-0 bottom-0 left-0 h-16" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 p-5">
          <span className="inline-flex w-fit rounded-full bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase backdrop-blur-sm dark:bg-slate-900/75 dark:text-slate-100">
            {OFFERING_LABELS[service.offeringType]}
          </span>
        </div>
        <h3
          className="absolute right-5 bottom-4 left-5 text-xl font-semibold text-slate-950 dark:text-white"
          data-testid="service-name"
        >
          {service.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <p className="min-h-18 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {service.description ?? ""}
        </p>
      </div>

      <ServiceCardOptionSelector service={service} />
    </div>
  );
};
