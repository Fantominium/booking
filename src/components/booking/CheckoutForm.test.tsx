import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CheckoutForm } from "@/components/booking/CheckoutForm";

describe("CheckoutForm", () => {
  it("submits customer details", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CheckoutForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Phone"), "5555555555");
    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
