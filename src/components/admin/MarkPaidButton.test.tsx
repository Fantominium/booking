import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarkPaidButton } from "@/components/admin/MarkPaidButton";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MarkPaidButton", () => {
  it("submits the verified amount and bank transfer reference", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<MarkPaidButton bookingId="booking-1" onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /reconcile transfer/i }));
    await user.type(screen.getByLabelText(/verified amount/i), "2000");
    await user.type(screen.getByLabelText(/bank reference/i), "BANK-REF-1001");
    await user.click(screen.getByRole("button", { name: /record transfer/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/bookings/booking-1/mark-paid",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedAmountCents: 2000, transferReference: "BANK-REF-1001" }),
      }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
