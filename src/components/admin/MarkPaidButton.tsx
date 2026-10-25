"use client";

import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useCallback, useState } from "react";

type MarkPaidButtonProps = {
  bookingId: string;
  onComplete?: () => void;
};

export const MarkPaidButton = ({ bookingId, onComplete }: MarkPaidButtonProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleCancel = useCallback(() => setIsOpen(false), []);
  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setVerifiedAmount(event.target.value);
  }, []);
  const handleReferenceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTransferReference(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verifiedAmountCents: Number(verifiedAmount),
            transferReference: transferReference.trim(),
          }),
        });

        if (!response.ok) {
          setError("Unable to reconcile this transfer. Check the amount and booking status.");
          return;
        }

        setIsOpen(false);
        setVerifiedAmount("");
        setTransferReference("");
        onComplete?.();
      } finally {
        setIsSubmitting(false);
      }
    },
    [bookingId, onComplete, transferReference, verifiedAmount],
  );

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        onClick={handleOpen}
        aria-haspopup="dialog"
      >
        Reconcile transfer
      </button>
      <Dialog
        open={isOpen}
        onClose={isSubmitting ? undefined : handleCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reconcile transfer</DialogTitle>
        <DialogContent>
          <form className="grid gap-2" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
              Verified amount (cents)
              <input
                aria-label="Verified amount"
                type="number"
                min="1"
                step="1"
                required
                value={verifiedAmount}
                onChange={handleAmountChange}
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
              Bank reference
              <input
                aria-label="Bank reference"
                type="text"
                maxLength={100}
                required
                value={transferReference}
                onChange={handleReferenceChange}
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </label>
            {error ? (
              <p role="alert" className="text-xs text-rose-600">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving" : "Record transfer"}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
