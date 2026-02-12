export type BusinessHours = {
  id: string;
  dayOfWeek: number;
  openingTime?: string | null;
  closingTime?: string | null;
  isOpen: boolean;
};

export type DateOverride = {
  id: string;
  date: string;
  isBlocked: boolean;
  customOpenTime?: string | null;
  customCloseTime?: string | null;
  reason?: string | null;
};
