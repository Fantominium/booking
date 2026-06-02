import { describe, expect, it, vi } from "vitest";

import { formatTime12Hour } from "@/lib/date-time";

describe("formatTime12Hour", () => {
  it("uses the system timezone settings", () => {
    const originalDateTimeFormat = Intl.DateTimeFormat;
    let receivedOptions: Intl.DateTimeFormatOptions | undefined;

    const mockedDateTimeFormat = function (
      this: Intl.DateTimeFormat,
      locale?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ): Intl.DateTimeFormat {
      receivedOptions = options;
      return originalDateTimeFormat(locale, options);
    } as typeof Intl.DateTimeFormat;

    const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(mockedDateTimeFormat);

    expect(formatTime12Hour("2026-05-22T13:30:00.000Z")).toBe(
      originalDateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(Date.parse("2026-05-22T13:30:00.000Z")),
    );
    expect(receivedOptions?.timeZone).toBeUndefined();

    spy.mockRestore();
  });

  it("formats midnight using the system timezone settings", () => {
    expect(formatTime12Hour("2026-05-22T00:00:00.000Z")).toBe(
      Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(Date.parse("2026-05-22T00:00:00.000Z")),
    );
  });
});
