export type BusinessHours = {
  id: string;
  dayOfWeek: number;
  openingTime?: string | null;
  closingTime?: string | null;
  isOpen: boolean;
  blockedRanges: BusinessHoursBlock[];
};

export type BusinessHoursBlock = {
  id: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
};

export type DateOverride = {
  id: string;
  startDate: string;
  endDate: string;
  isBlocked: boolean;
  customOpenTime?: string | null;
  customCloseTime?: string | null;
  reason?: string | null;
};
