"use client";

import { useCallback, useState } from "react";

type CancelBookingButtonProps = {
  bookingId: string;
  onComplete?: () => void;
};

export const CancelBookingButton = ({
  bookingId,
  onComplete,
}: CancelBookingButtonProps): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = useCallback(async () => {
    const confirmed = globalThis.confirm("Cancel this booking?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        return;
      }

      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingId, onComplete]);

  return (
    <button
      type="button"
      className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
      onClick={handleClick}
      disabled={isSubmitting}
      aria-label="Cancel booking"
    >
      {isSubmitting ? "Cancelling" : "Cancel"}
    </button>
  );
};
