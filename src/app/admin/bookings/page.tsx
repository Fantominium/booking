import { BookingsClientPage } from "./bookings-client-page";
import { requireAdminPageSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const BookingManagementPage = async (): Promise<JSX.Element> => {
  await requireAdminPageSession("/admin/bookings");
  return <BookingsClientPage />;
};

export default BookingManagementPage;
