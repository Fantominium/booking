export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type EmailDeliveryStatus = "SUCCESS" | "FAILED" | "RETRYING";

export type Booking = {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  emailDeliveryStatus: EmailDeliveryStatus;
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
};

export type AdminBooking = Booking & {
  serviceName: string;
};
