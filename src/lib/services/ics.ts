import { createEvents } from "ics";

export type IcsEventInput = {
  title: string;
  description: string;
  start: [number, number, number, number, number];
  durationMinutes: number;
  location?: string;
};

export const createIcsEvent = (event: IcsEventInput): string => {
  const { error, value } = createEvents([
    {
      title: event.title,
      description: event.description,
      start: event.start,
      duration: { minutes: event.durationMinutes },
      location: event.location,
      alarms: [{ action: "display", trigger: { hours: 24, before: true } }],
    },
  ]);

  if (error || !value) {
    throw new Error("Failed to generate calendar event");
  }

  return value;
};
