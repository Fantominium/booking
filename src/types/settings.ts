export type SystemSettings = {
  id: string;
  maxBookingsPerDay: number;
  bufferMinutes: number;
  bankTransferInstructions?: string | null;
  updatedAt: string;
};
