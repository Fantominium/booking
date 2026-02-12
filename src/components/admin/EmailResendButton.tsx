"use client";

import { useCallback, useState } from "react";

type EmailResendButtonProps = {
  bookingId: string;
  onComplete?: () => void;
};

export const EmailResendButton = ({
  bookingId,
  onComplete,
}: EmailResendButtonProps): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = useCallback(async () => {
    const confirmed = globalThis.confirm("Resend the latest booking email?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/resend-email`, {
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
      aria-label="Resend booking email"
    >
      {isSubmitting ? "Resending" : "Resend email"}
    </button>
  );
};
