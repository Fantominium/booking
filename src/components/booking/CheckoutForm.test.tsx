import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CheckoutForm } from "@/components/booking/CheckoutForm";

describe("CheckoutForm", () => {
  it("submits customer details with the default card payment option", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CheckoutForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Phone"), "5555555555");
    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(onSubmit).toHaveBeenCalledWith({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "5555555555",
      paymentMethod: "CARD",
    });
  });

  it("allows the customer to choose bank transfer", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CheckoutForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Phone"), "5555555555");
    await user.click(screen.getByRole("radio", { name: /reserve with bank transfer/i }));
    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(onSubmit).toHaveBeenCalledWith({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "5555555555",
      paymentMethod: "BANK_TRANSFER",
    });
  });
});
