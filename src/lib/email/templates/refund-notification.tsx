import React from "react";

type RefundNotificationEmailProps = {
  customerName: string;
  serviceName: string;
  bookingId: string;
};

export const RefundNotificationEmail = ({
  customerName,
  serviceName,
  bookingId,
}: RefundNotificationEmailProps): React.ReactElement => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, color: "#1f2933" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>Your refund is in progress</h1>
      <p>Hi {customerName},</p>
      <p>
        We have initiated your refund for the {serviceName} booking. The refund will be processed
        automatically by your payment provider.
      </p>
      <p>
        Booking reference: <strong>{bookingId}</strong>
      </p>
      <p>If you have any questions, reply to this email and we will help.</p>
      <p>Thank you for choosing TruFlow.</p>
    </div>
  );
};
