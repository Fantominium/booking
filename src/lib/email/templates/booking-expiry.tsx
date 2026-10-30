import React from "react";

export type BookingExpiryProps = {
  customerName: string;
  serviceName: string;
  startTime: string;
};

export const BookingExpiryEmail = ({
  customerName,
  serviceName,
  startTime,
}: BookingExpiryProps): JSX.Element => (
  <div>
    <h1>Reservation expired</h1>
    <p>Hi {customerName},</p>
    <p>Your pending bank-transfer reservation for {serviceName} has expired.</p>
    <p>Original start time: {startTime}</p>
    <p>You can make a new booking if the time is still available.</p>
  </div>
);
