import { differenceInMinutes } from "date-fns";

export const getBookedServiceDurationMinutes = (params: {
  startTime: Date;
  endTime: Date;
  bufferMinutes: number;
}): number => {
  const appointmentMinutes = Math.max(differenceInMinutes(params.endTime, params.startTime), 0);
  return Math.max(appointmentMinutes - params.bufferMinutes, 1);
};
