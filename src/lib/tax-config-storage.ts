import type { TaxConfig } from "@/lib/api";

export const taxConfigStorage = {
  get(): TaxConfig[] {
    if (typeof window === "undefined") return [];
    // const data = localStorage.getItem(STORAGE_KEY);
    // return data ? (JSON.parse(data) as TaxConfig[]) : [];
    return [];
  },
};
