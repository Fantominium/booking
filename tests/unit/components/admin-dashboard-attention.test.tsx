import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({ useSession: () => ({ status: "authenticated" }) }));
vi.mock("@/components/admin/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

const base = { bookings: [], unpaidBalances: [], todayFormatted: "Friday" };
const item = {
  id: "b1",
  customerName: "Taylor",
  startTime: "2030-01-01T14:00:00.000Z",
  serviceName: "Massage",
  reviewGraceExpiresAt: "2030-01-01T10:00:00.000Z",
};

describe("admin dashboard attention sections", () => {
  it("renders truthful empty states when nothing needs attention (and when props are omitted)", () => {
    render(<AdminDashboardClient {...base} />);

    expect(screen.getByText("No transfers are awaiting review.")).toBeInTheDocument();
    expect(screen.getByText("No reservations expired in the last 7 days.")).toBeInTheDocument();
    expect(screen.getByText("No email delivery failures recorded.")).toBeInTheDocument();
  });

  it("lists transfers in review, expired reservations, and email failures", () => {
    render(
      <AdminDashboardClient {...base} transferReviews={[item]} expiredTransfers={[item]} emailFailures={[item]} />,
    );

    expect(within(screen.getByTestId("transfer-reviews")).getByText(/Will be released after/)).toBeInTheDocument();
    expect(within(screen.getByTestId("expired-transfers")).getByText(/slot released/)).toBeInTheDocument();
    expect(within(screen.getByTestId("email-failures")).getByText(/Taylor · Massage/)).toBeInTheDocument();
    expect(screen.queryByText("No email delivery failures recorded.")).not.toBeInTheDocument();
  });
});
