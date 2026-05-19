export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type EmailDeliveryStatus = "SUCCESS" | "FAILED" | "RETRYING";
export type PaymentMethod = "CARD" | "BANK_TRANSFER";
export type PaymentState = "UNPAID" | "PENDING_BANK_TRANSFER" | "DEPOSIT_PAID" | "PAID_IN_FULL";

export type Booking = {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentState: PaymentState;
  emailDeliveryStatus: EmailDeliveryStatus;
  bankTransferReference?: string | null;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
};

export type AdminBooking = Booking & {
  serviceName: string;
};
