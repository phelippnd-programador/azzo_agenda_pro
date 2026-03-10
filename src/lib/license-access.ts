export type LicenseAccessStatus = "UNKNOWN" | "ACTIVE" | "BLOCKED";

const PLAN_EXPIRED_BLOCK_KEY = "azzo_plan_expired_blocked";
const LICENSE_ACCESS_STATUS_KEY = "azzo_license_access_status";
const LICENSE_ACCESS_EVENT = "azzo:plan-expired-changed";

let currentStatus: LicenseAccessStatus = "UNKNOWN";

const canUseBrowserApis = () =>
  typeof window !== "undefined" && typeof sessionStorage !== "undefined";

const normalizeStatus = (value?: string | null): LicenseAccessStatus => {
  const status = String(value || "").toUpperCase();
  if (status === "ACTIVE" || status === "BLOCKED" || status === "UNKNOWN") return status;
  return "UNKNOWN";
};

export const readLicenseAccessStatus = (): LicenseAccessStatus => {
  if (!canUseBrowserApis()) return "UNKNOWN";
  try {
    const raw = normalizeStatus(sessionStorage.getItem(LICENSE_ACCESS_STATUS_KEY));
    if (raw !== "UNKNOWN") return raw;
    if (sessionStorage.getItem(PLAN_EXPIRED_BLOCK_KEY) === "1") return "BLOCKED";
  } catch {
    // ignore storage errors
  }
  return "UNKNOWN";
};

export const getLicenseAccessStatus = (): LicenseAccessStatus => {
  if (currentStatus === "UNKNOWN") {
    currentStatus = readLicenseAccessStatus();
  }
  return currentStatus;
};

export const isLicenseAccessBlocked = () => getLicenseAccessStatus() === "BLOCKED";

export const setLicenseAccessStatus = (status: LicenseAccessStatus) => {
  currentStatus = status;
  if (!canUseBrowserApis()) return;
  try {
    sessionStorage.setItem(LICENSE_ACCESS_STATUS_KEY, status);
    if (status === "BLOCKED") {
      sessionStorage.setItem(PLAN_EXPIRED_BLOCK_KEY, "1");
    } else {
      sessionStorage.removeItem(PLAN_EXPIRED_BLOCK_KEY);
    }
    window.dispatchEvent(
      new CustomEvent(LICENSE_ACCESS_EVENT, {
        detail: {
          blocked: status === "BLOCKED",
          status,
        },
      })
    );
  } catch {
    // ignore storage/event errors
  }
};

export const subscribeLicenseAccessStatus = (
  listener: (status: LicenseAccessStatus) => void
) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ status?: string }>;
    const status = normalizeStatus(customEvent.detail?.status);
    listener(status);
  };
  window.addEventListener(LICENSE_ACCESS_EVENT, handler as EventListener);
  return () => window.removeEventListener(LICENSE_ACCESS_EVENT, handler as EventListener);
};
