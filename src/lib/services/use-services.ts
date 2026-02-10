import { useCallback, useEffect, useState } from "react";

import type { Service } from "@/types/service";

export interface UseServicesResult {
  services: Service[];
  statusMessage: string | null;
  refresh: () => void;
}

export const useServices = (): UseServicesResult => {
  const [services, setServices] = useState<Service[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchServices = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/admin/services");
      if (!response.ok) {
        setStatusMessage("Unable to load services.");
        return;
      }

      const data = (await response.json()) as { services: Service[] };
      setServices(data.services);
    } catch (error) {
      console.error(error);
      setStatusMessage("Unable to load services.");
    }
  }, []);

  const refresh = useCallback((): void => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async (): Promise<void> => {
      await fetchServices();
      if (!isMounted) {
        return;
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchServices, refreshKey]);

  return { services, statusMessage, refresh };
};
