import React from "react";

export type BookingCancellationProps = {
  customerName: string;
  serviceName: string;
  startTime: string;
  location: string;
};

export const BookingCancellationEmail = ({
  customerName,
  serviceName,
  startTime,
  location,
}: BookingCancellationProps): JSX.Element => {
  return (
    <div>
      <h1>Booking cancelled</h1>
      <p>Hi {customerName},</p>
      <p>Your booking for {serviceName} has been cancelled.</p>
      <p>Original start time: {startTime}</p>
      <p>Location: {location}</p>
      <p>If you need to reschedule, please reach out anytime.</p>
    </div>
  );
};
