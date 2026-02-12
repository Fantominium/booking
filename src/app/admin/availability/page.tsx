import { BusinessHoursForm } from "@/components/admin/BusinessHoursForm";
import { DateOverrideForm } from "@/components/admin/DateOverrideForm";
import { SystemSettingsForm } from "@/components/admin/SystemSettingsForm";
import { prisma } from "@/lib/prisma";
import type { BusinessHours, DateOverride } from "@/types/availability";

const formatTime = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  const hours = value.getUTCHours().toString().padStart(2, "0");
  const minutes = value.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const mapBusinessHours = (entry: {
  id: string;
  dayOfWeek: number;
  openingTime: Date | null;
  closingTime: Date | null;
  isOpen: boolean;
}): BusinessHours => ({
  id: entry.id,
  dayOfWeek: entry.dayOfWeek,
  openingTime: formatTime(entry.openingTime),
  closingTime: formatTime(entry.closingTime),
  isOpen: entry.isOpen,
});

const mapDateOverride = (entry: {
  id: string;
  date: Date;
  isBlocked: boolean;
  customOpenTime: Date | null;
  customCloseTime: Date | null;
  reason: string | null;
}): DateOverride => ({
  id: entry.id,
  date: entry.date.toISOString().slice(0, 10),
  isBlocked: entry.isBlocked,
  customOpenTime: formatTime(entry.customOpenTime),
  customCloseTime: formatTime(entry.customCloseTime),
  reason: entry.reason,
});

const AvailabilityPage = async (): Promise<JSX.Element> => {
  const businessHours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  const dateOverrides = await prisma.dateOverride.findMany({
    orderBy: { date: "asc" },
  });
  const existingSettings = await prisma.systemSettings.findFirst();
  const settings =
    existingSettings ??
    (await prisma.systemSettings.create({
      data: {
        maxBookingsPerDay: 8,
        bufferMinutes: 15,
      },
    }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 bg-slate-50 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Availability settings</h1>
        <p className="text-slate-700">
          Manage weekly business hours and keep your calendar up to date.
        </p>
      </header>
      <BusinessHoursForm initialHours={businessHours.map(mapBusinessHours)} />
      <DateOverrideForm initialOverrides={dateOverrides.map(mapDateOverride)} />
      <SystemSettingsForm
        initialSettings={{
          id: settings.id,
          maxBookingsPerDay: settings.maxBookingsPerDay,
          bufferMinutes: settings.bufferMinutes,
          updatedAt: settings.updatedAt.toISOString(),
        }}
      />
    </main>
  );
};

export default AvailabilityPage;
