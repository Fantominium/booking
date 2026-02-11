import { purgeOldCustomerData } from "@/lib/services/data-deletion";

export const runPiiPurge = async (): Promise<number> => {
  return purgeOldCustomerData();
};
