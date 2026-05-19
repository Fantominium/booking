import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "@/components/booking/DatePicker";

describe("DatePicker", () => {
  it("selects a date from the native date input", () => {
    const onSelect = vi.fn();

    render(<DatePicker dates={["2026-02-10"]} selectedDate={undefined} onSelect={onSelect} />);

    const input = screen.getByTestId("date-input");
    fireEvent.change(input, { target: { value: "2026-02-10" } });

    expect(onSelect).toHaveBeenCalledWith("2026-02-10");
  });

  it("rejects dates that are not in the available list", () => {
    const onSelect = vi.fn();

    render(<DatePicker dates={["2026-02-10"]} selectedDate={undefined} onSelect={onSelect} />);

    const input = screen.getByTestId("date-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-02-09" } });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("sets min and max attributes from available dates", () => {
    const onSelect = vi.fn();

    render(
      <DatePicker
        dates={["2026-02-10", "2026-02-15", "2026-02-20"]}
        selectedDate={undefined}
        onSelect={onSelect}
      />,
    );

    const input = screen.getByTestId("date-input") as HTMLInputElement;
    expect(input.min).toBe("2026-02-10");
    expect(input.max).toBe("2026-02-20");
  });
});
