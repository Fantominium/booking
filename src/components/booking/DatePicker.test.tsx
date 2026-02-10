import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "@/components/booking/DatePicker";

describe("DatePicker", () => {
  it("selects a date", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<DatePicker dates={["2026-02-10"]} selectedDate={undefined} onSelect={onSelect} />);

    await user.click(screen.getByText("2026-02-10"));
    expect(onSelect).toHaveBeenCalledWith("2026-02-10");
  });
});
