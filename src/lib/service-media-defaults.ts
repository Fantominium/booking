const DEFAULT_SERVICE_MEDIA: Array<{ match: string; url: string }> = [
  { match: "deep tissue massage", url: "/uploads/service-media/DeepTissue.mp4" },
  { match: "sports massage", url: "/uploads/service-media/Sports.mp4" },
  { match: "sweedish massage", url: "/uploads/service-media/Sweedish.mp4" },
  { match: "swedish massage", url: "/uploads/service-media/Sweedish.mp4" },
];

export const getDefaultServiceMediaUrl = (serviceName: string): string | null => {
  const normalizedName = serviceName.toLowerCase();
  return DEFAULT_SERVICE_MEDIA.find(({ match }) => normalizedName.includes(match))?.url ?? null;
};
