import { useRegisterSW } from "virtual:pwa-register/react";

export function useAppUpdateCheck() {
  const {
    needRefresh: [updateAvailable],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });

  const applyUpdate = () => {
    void updateServiceWorker(true);
  };

  return { updateAvailable, applyUpdate };
}
