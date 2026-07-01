import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

async function fetchBuildTime(): Promise<number> {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return 0;
  const data = await res.json();
  return typeof data.buildTime === "number" ? data.buildTime : 0;
}

export function useAppUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentBuildTime, setCurrentBuildTime] = useState(0);

  useEffect(() => {
    let mounted = true;

    fetchBuildTime().then((buildTime) => {
      if (mounted && buildTime > 0) setCurrentBuildTime(buildTime);
    });

    const interval = setInterval(async () => {
      const latest = await fetchBuildTime();
      if (mounted && currentBuildTime > 0 && latest > currentBuildTime) {
        setUpdateAvailable(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBuildTime]);

  const applyUpdate = () => window.location.reload();

  return { updateAvailable, applyUpdate };
}
