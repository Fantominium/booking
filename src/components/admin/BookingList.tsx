"use client";

import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowSelectionModel,
  type GridValueFormatter,
} from "@mui/x-data-grid";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CancelBookingButton } from "@/components/admin/CancelBookingButton";
import { MarkPaidButton } from "@/components/admin/MarkPaidButton";
import type { AdminBooking } from "@/types/booking";

const formatMoney = (amountCents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
};

type BookingListProps = {
  onSelectBooking?: (booking: AdminBooking | null) => void;
};

type BookingFilters = {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
};

const defaultFilters: BookingFilters = {
  search: "",
  status: "",
  startDate: "",
  endDate: "",
};

export const BookingList = ({ onSelectBooking }: BookingListProps): JSX.Element => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filters, setFilters] = useState<BookingFilters>(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [searchInput]);

  const buildQueryString = useCallback((nextFilters: BookingFilters): string => {
    const params = new URLSearchParams();
    if (nextFilters.search) {
      params.set("search", nextFilters.search);
    }
    if (nextFilters.status) {
      params.set("status", nextFilters.status);
    }
    if (nextFilters.startDate) {
      params.set("startDate", nextFilters.startDate);
    }
    if (nextFilters.endDate) {
      params.set("endDate", nextFilters.endDate);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }, []);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const query = buildQueryString(filters);
      const response = await fetch(`/api/admin/bookings${query}`);

      if (!response.ok) {
        setStatusMessage("Unable to load bookings.");
        return;
      }

      const data = (await response.json()) as { bookings: AdminBooking[] };
      setBookings(data.bookings);
    } catch (error) {
      console.error(error);
      setStatusMessage("Unable to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, filters]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, startDate: value }));
  }, []);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, endDate: value }));
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleActionComplete = useCallback(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleSelectionChange = useCallback(
    (selection: GridRowSelectionModel) => {
      const selectedId = selection[0];
      if (!selectedId) {
        onSelectBooking?.(null);
        return;
      }

      const selected = bookings.find((booking) => booking.id === selectedId);
      onSelectBooking?.(selected ?? null);
    },
    [bookings, onSelectBooking],
  );

  const renderActions = useCallback(
    (params: GridRenderCellParams<AdminBooking>) => {
      return (
        <div className="flex items-center gap-2">
          <MarkPaidButton bookingId={params.row.id} onComplete={handleActionComplete} />
          <CancelBookingButton bookingId={params.row.id} onComplete={handleActionComplete} />
        </div>
      );
    },
    [handleActionComplete],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "customerName", headerName: "Customer", flex: 1, minWidth: 160 },
      { field: "serviceName", headerName: "Service", flex: 1, minWidth: 180 },
      {
        field: "startTime",
        headerName: "Start",
        flex: 1,
        minWidth: 180,
        valueFormatter: ((value) =>
          new Date(value as string).toLocaleString()) as GridValueFormatter,
      },
      { field: "status", headerName: "Status", flex: 0.7, minWidth: 120 },
      {
        field: "remainingBalanceCents",
        headerName: "Balance",
        flex: 0.7,
        minWidth: 120,
        valueFormatter: ((value) => formatMoney(Number(value))) as GridValueFormatter,
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: renderActions,
      },
    ],
    [renderActions],
  );

  const getRowId = useCallback((row: AdminBooking) => row.id, []);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Bookings</h2>
        <p className="text-sm text-slate-600">Filter and manage upcoming appointments.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Search</span>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            className="rounded-md border border-slate-200 px-3 py-2"
            placeholder="Name or phone"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Status</span>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>Start date</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={handleStartDateChange}
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span>End date</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={handleEndDateChange}
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <div className="h-130">
        <DataGrid
          rows={bookings}
          columns={columns}
          getRowId={getRowId}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>

      {statusMessage ? <p className="text-sm text-rose-600">{statusMessage}</p> : null}
    </section>
  );
};
