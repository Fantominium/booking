import { AdminsClientPage } from "./admins-client-page";
import { requireAdminPageSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const ManageAdminsPage = async (): Promise<JSX.Element> => {
  await requireAdminPageSession("/admin/admins");
  return <AdminsClientPage />;
};

export default ManageAdminsPage;
