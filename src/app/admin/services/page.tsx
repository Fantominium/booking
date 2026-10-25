import { ServicesClientPage } from "./services-client-page";
import { requireAdminPageSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const ServiceConfigurationPage = async (): Promise<JSX.Element> => {
  await requireAdminPageSession("/admin/services");
  return <ServicesClientPage />;
};

export default ServiceConfigurationPage;
