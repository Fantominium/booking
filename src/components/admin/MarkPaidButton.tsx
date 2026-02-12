"use client";

import { useCallback, useState } from "react";

type MarkPaidButtonProps = {
  bookingId: string;
  onComplete?: () => void;
};

export const MarkPaidButton = ({ bookingId, onComplete }: MarkPaidButtonProps): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = useCallback(async () => {
    const confirmed = globalThis.confirm("Mark remaining balance as paid?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/mark-paid`, {
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
      className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
      onClick={handleClick}
      disabled={isSubmitting}
      aria-label="Mark balance as paid"
    >
      {isSubmitting ? "Saving" : "Mark paid"}
    </button>
  );
};
