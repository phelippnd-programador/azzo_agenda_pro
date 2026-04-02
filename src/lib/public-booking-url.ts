const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const isLocalHost = (host: string) => LOCAL_HOSTS.has(host.toLowerCase());

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");
const normalizePath = (value: string) => value.trim().replace(/^\/+|\/+$/g, "");
const buildPath = (basePath: string, slug: string) => {
  const normalizedBasePath = normalizePath(basePath);
  return normalizedBasePath ? `/${normalizedBasePath}/agendar/${slug}` : `/agendar/${slug}`;
};

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
  const normalizedSlug = normalizePath(salonSlug || "");
  if (!normalizedSlug) return "";

  if (absoluteBaseUrl) {
    try {
      const parsedUrl = new URL(normalizeBaseUrl(absoluteBaseUrl));
      const pathSegments = normalizePath(parsedUrl.pathname)
        .split("/")
        .filter(Boolean);
      const agendarIndex = pathSegments.lastIndexOf("agendar");
      const baseSegments = agendarIndex >= 0 ? pathSegments.slice(0, agendarIndex) : pathSegments;
      return `${parsedUrl.origin}${buildPath(baseSegments.join("/"), normalizedSlug)}`;
    } catch {
      // fallback below
    }
  }

  return `${resolvePublicAppBaseUrl()}/agendar/${normalizedSlug}`;
};
