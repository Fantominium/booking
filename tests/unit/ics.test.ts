import { describe, expect, it } from "vitest";

import { createIcsEvent } from "@/lib/services/ics";

describe("ICS generation", () => {
  it("produces RFC 5545 content", () => {
    const value = createIcsEvent({
      title: "Deep Tissue Massage - TruFlow",
      description: "Test booking",
      start: [2026, 2, 10, 10, 0],
      durationMinutes: 60,
      location: "TruFlow Studio",
    });

    expect(value).toContain("BEGIN:VCALENDAR");
    expect(value).toContain("BEGIN:VEVENT");
  });
});
