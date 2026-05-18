"use client";

import { useCallback, useMemo, useState } from "react";

import { ServiceForm, type ServiceFormValues } from "@/components/admin/ServiceForm";
import { ServiceList } from "@/components/admin/ServiceList";

const emptyService: ServiceFormValues = {
  name: "",
  description: "",
  offeringType: "SESSION",
  durationMin: 60,
  priceCents: 0,
  downpaymentCents: 0,
  isActive: true,
};

const ServiceConfigurationPage = (): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const modalClassName = useMemo(() => {
    return "fixed inset-0 z-50 flex items-center justify-center bg-black/40";
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    setStatusMessage(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCreateService = useCallback(async (values: ServiceFormValues) => {
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setStatusMessage("Unable to create service.");
      return;
    }

    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.18),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.12),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Service configuration
          </h1>
          <p className="text-slate-700 dark:text-slate-200">
            Add or edit services that appear in the booking flow.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={handleOpenModal}
        >
          Add service
        </button>
      </header>

      <ServiceList refreshKey={refreshKey} />

      {statusMessage ? <p className="text-sm text-rose-600">{statusMessage}</p> : null}

      {isModalOpen ? (
        <dialog open className={modalClassName}>
          <div className="dark:bg-surface-elevated w-full max-w-xl rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add service</h2>
              <button
                type="button"
                className="text-sm text-slate-500 dark:text-slate-300"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
            <ServiceForm
              initialValues={emptyService}
              onSubmit={handleCreateService}
              onCancel={handleCloseModal}
              submitLabel="Create service"
            />
          </div>
        </dialog>
      ) : null}
    </main>
  );
};

export default ServiceConfigurationPage;
