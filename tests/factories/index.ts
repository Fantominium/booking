type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  downpaymentCents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Booking = {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  endTime: Date;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type BusinessHours = {
  id: string;
  dayOfWeek: number;
  openingTime: Date | null;
  closingTime: Date | null;
  isOpen: boolean;
};

type DateOverride = {
  id: string;
  date: Date;
  isBlocked: boolean;
  customOpenTime: Date | null;
  customCloseTime: Date | null;
  reason: string | null;
};

type SystemSettings = {
  id: string;
  maxBookingsPerDay: number;
  bufferMinutes: number;
  updatedAt: Date;
};

export const buildService = (overrides: Partial<Service> = {}): Service => ({
  id: "service-1",
  name: "Deep Tissue Massage",
  description: "Deep tissue description",
  durationMin: 60,
  priceCents: 8000,
  downpaymentCents: 2000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "booking-1",
  serviceId: "service-1",
  customerName: "Test Customer",
  customerEmail: "test@example.com",
  customerPhone: "5555555555",
  startTime: new Date(),
  endTime: new Date(),
  status: "PENDING",
  stripePaymentIntentId: null,
  stripeCustomerId: null,
  downpaymentPaidCents: 0,
  remainingBalanceCents: 6000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildBusinessHours = (overrides: Partial<BusinessHours> = {}): BusinessHours => ({
  id: "hours-1",
  dayOfWeek: 0,
  openingTime: new Date("1970-01-01T09:00:00Z"),
  closingTime: new Date("1970-01-01T17:00:00Z"),
  isOpen: true,
  ...overrides,
});

export const buildDateOverride = (overrides: Partial<DateOverride> = {}): DateOverride => ({
  id: "override-1",
  date: new Date("2026-12-25"),
  isBlocked: true,
  customOpenTime: null,
  customCloseTime: null,
  reason: "Holiday",
  ...overrides,
});

export const buildSystemSettings = (overrides: Partial<SystemSettings> = {}): SystemSettings => ({
  id: "settings-1",
  maxBookingsPerDay: 8,
  bufferMinutes: 15,
  updatedAt: new Date(),
  ...overrides,
});
