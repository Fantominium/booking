"use client";

import type React from "react";
import { useCallback, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ServiceForm, type ServiceFormValues } from "@/components/admin/ServiceForm";
import type { Service } from "@/types/service";

type ServiceListProps = {
  refreshKey: number;
};

const mapServiceToForm = (service: Service): ServiceFormValues => ({
  name: service.name,
  description: service.description ?? "",
  durationMin: service.durationMin,
  priceCents: service.priceCents,
  downpaymentCents: service.downpaymentCents,
  isActive: service.isActive,
});

export const ServiceList = ({ refreshKey }: ServiceListProps): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  const { data: services = [], error } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async (): Promise<Service[]> => {
      const response = await fetch("/api/admin/services");
      if (!response.ok) {
        throw new Error("Unable to load services.");
      }
      const data = (await response.json()) as { services: Service[] };
      return data.services;
    },
  });

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
  }, [refreshKey, queryClient]);

  const statusMessage = error ? (error as Error).message : null;

  const handleEditClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    setEditingServiceId(id);
    setDeleteError(null);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingServiceId(null);
  }, []);

  const handleInlineSubmit = useCallback(
    async (values: ServiceFormValues) => {
      if (!editingServiceId) {
        return;
      }

      const response = await fetch(`/api/admin/services/${editingServiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setStatusMessage("Unable to update service.");
        return;
      }

      const data = (await response.json()) as { service: Service };
      setServices((prev) =>
        prev.map((service) => (service.id === data.service.id ? data.service : service)),
      );
      setEditingServiceId(null);
    },
    [editingServiceId],
  );

  const handleDeleteClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }

    const confirmed = globalThis.confirm("Delete this service?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (response.status === 409) {
      setDeleteError({
        id,
        message: "Service has future bookings. Mark it inactive instead.",
      });
      return;
    }

    if (!response.ok) {
      setStatusMessage("Unable to delete service.");
      return;
    }

    setServices((prev) => prev.filter((service) => service.id !== id));
  }, []);

  const handleMarkInactive = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }

    const response = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    if (!response.ok) {
      setStatusMessage("Unable to mark service inactive.");
      return;
    }

    const data = (await response.json()) as { service: Service };
    setServices((prev) =>
      prev.map((service) => (service.id === data.service.id ? data.service : service)),
    );
    setDeleteError(null);
  }, []);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-slate-900">Services</h2>
        <p className="text-sm text-slate-600">Manage service pricing and availability.</p>
      </header>

      <div className="grid gap-4">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-slate-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{service.name}</div>
                <div className="text-xs text-slate-600">
                  {service.durationMin} min · ${service.priceCents / 100} · Downpayment $
                  {service.downpaymentCents / 100}
                </div>
                <div className="text-xs text-slate-500">
                  {service.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-id={service.id}
                  onClick={handleEditClick}
                  className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-id={service.id}
                  onClick={handleDeleteClick}
                  className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                >
                  Delete
                </button>
                {deleteError?.id === service.id ? (
                  <button
                    type="button"
                    data-id={service.id}
                    onClick={handleMarkInactive}
                    className="rounded-md border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700"
                  >
                    Mark inactive
                  </button>
                ) : null}
              </div>
            </div>

            {editingServiceId === service.id ? (
              <div className="mt-4">
                <ServiceForm
                  initialValues={mapServiceToForm(service)}
                  onSubmit={handleInlineSubmit}
                  onCancel={handleEditCancel}
                  submitLabel="Save"
                  variant="inline"
                />
              </div>
            ) : null}

            {deleteError?.id === service.id ? (
              <p className="mt-3 text-sm text-rose-600">{deleteError.message}</p>
            ) : null}
          </div>
        ))}
      </div>

      {statusMessage ? <p className="text-sm text-rose-600">{statusMessage}</p> : null}
    </section>
  );
};
