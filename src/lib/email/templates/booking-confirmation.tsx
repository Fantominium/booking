import React from "react";

export type BookingConfirmationProps = {
  customerName: string;
  serviceName: string;
  startTime: string;
  location: string;
};

export const BookingConfirmationEmail = ({
  customerName,
  serviceName,
  startTime,
  location,
}: BookingConfirmationProps): JSX.Element => {
  return (
    <div>
      <h1>Booking confirmed</h1>
      <p>Hi {customerName},</p>
      <p>Your booking for {serviceName} is confirmed.</p>
      <p>Start time: {startTime}</p>
      <p>Location: {location}</p>
      <p>We have attached a calendar invite.</p>
    </div>
  );
};
