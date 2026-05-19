import type { OfferingType } from "@/types/service";

export const OFFERING_LABELS: Record<OfferingType, string> = {
  SESSION: "Session",
  EVENT: "Event",
  RENTAL: "Rental",
};

export const OFFERING_DESCRIPTIONS: Record<OfferingType, string> = {
  SESSION: "One-to-one guided appointments.",
  EVENT: "Group experiences for teams, retreats, and community sessions.",
  RENTAL: "Private spaces reserved for self-led or hosted recovery time.",
};