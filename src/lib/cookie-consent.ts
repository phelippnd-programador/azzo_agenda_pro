export const COOKIE_CONSENT_STORAGE_KEY = "azzo_cookie_consent_v2";
export const COOKIE_CONSENT_VERSION = "2026-03-01";
const COOKIE_CONSENT_TTL_DAYS = 180;

export type CookieConsentChoice = "accepted" | "rejected";

export type CookieConsentRecord = {
  choice: CookieConsentChoice;
  version: string;
  createdAt: string;
  expiresAt: string;
};

const now = () => new Date();

const addDays = (base: Date, days: number) => {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const readCookieConsent = (): CookieConsentRecord | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (!parsed?.choice || !parsed?.version || !parsed?.expiresAt) return null;
    const expiry = new Date(parsed.expiresAt);
    if (Number.isNaN(expiry.getTime()) || expiry < now()) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const persistCookieConsent = (choice: CookieConsentChoice): CookieConsentRecord => {
  const createdAt = now();
  const expiresAt = addDays(createdAt, COOKIE_CONSENT_TTL_DAYS);
  const record: CookieConsentRecord = {
    choice,
    version: COOKIE_CONSENT_VERSION,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  }
  return record;
};

export const revokeCookieConsent = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  }
};

export const hasNonEssentialCookieConsent = () => {
  const record = readCookieConsent();
  if (!record) return false;
  return record.choice === "accepted" && record.version === COOKIE_CONSENT_VERSION;
};

