import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";

describe("TimeSlotPicker", () => {
  it("selects a slot", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TimeSlotPicker
        slots={[{ start: "2026-02-10T10:00:00.000Z", end: "2026-02-10T11:15:00.000Z" }]}
        selectedStart={undefined}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("2026-02-10T10:00:00.000Z");
  });
});
