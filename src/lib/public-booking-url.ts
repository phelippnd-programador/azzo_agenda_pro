const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const isLocalHost = (host: string) => LOCAL_HOSTS.has(host.toLowerCase());

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

export const resolvePublicAppBaseUrl = () => {
  const raw =
    (import.meta.env.NEXT_PUBLIC_APP_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_BOOKING_BASE_URL as string | undefined) ||
    window.location.origin;

  const normalized = normalizeBaseUrl(raw || "");
  if (!normalized) {
    throw new Error("NEXT_PUBLIC_APP_URL nao configurada");
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL invalida");
  }

  if (import.meta.env.PROD && isLocalHost(url.hostname)) {
    throw new Error("NEXT_PUBLIC_APP_URL nao pode usar localhost em producao");
  }

  return normalizeBaseUrl(url.toString());
};

export const buildPublicBookingUrl = (salonSlug: string, absoluteBaseUrl?: string) => {
  const slug = (salonSlug || "").trim();
  if (!slug) return "";
  const base = absoluteBaseUrl ? normalizeBaseUrl(absoluteBaseUrl) : resolvePublicAppBaseUrl();
  return `${base}/agendar/${slug}`;
};
