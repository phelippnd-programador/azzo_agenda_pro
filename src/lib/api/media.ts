import { API_URL } from "./core";

export const resolveApiMediaUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (!value.startsWith("/")) return value;

  const apiOrigin = API_URL.replace(/\/api\/v1$/, "");
  try {
    return new URL(value, `${apiOrigin}/`).toString();
  } catch {
    return value;
  }
};
