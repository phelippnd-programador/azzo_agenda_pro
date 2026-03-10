import { useCallback, useEffect, useState } from "react";
import { refreshLicenseAccessStatus } from "@/lib/api";
import {
  getLicenseAccessStatus,
  setLicenseAccessStatus,
  subscribeLicenseAccessStatus,
  type LicenseAccessStatus,
} from "@/lib/license-access";

export const useLicenseAccess = () => {
  const [status, setStatus] = useState<LicenseAccessStatus>(() => getLicenseAccessStatus());

  useEffect(() => {
    return subscribeLicenseAccessStatus((nextStatus) => {
      setStatus(nextStatus);
    });
  }, []);

  const refreshStatus = useCallback(async () => {
    const nextStatus = await refreshLicenseAccessStatus();
    setStatus(nextStatus);
    return nextStatus;
  }, []);

  const setBlocked = useCallback(() => {
    setLicenseAccessStatus("BLOCKED");
    setStatus("BLOCKED");
  }, []);

  const setActive = useCallback(() => {
    setLicenseAccessStatus("ACTIVE");
    setStatus("ACTIVE");
  }, []);

  const setUnknown = useCallback(() => {
    setLicenseAccessStatus("UNKNOWN");
    setStatus("UNKNOWN");
  }, []);

  return {
    status,
    isBlocked: status === "BLOCKED",
    refreshStatus,
    setBlocked,
    setActive,
    setUnknown,
  };
};
