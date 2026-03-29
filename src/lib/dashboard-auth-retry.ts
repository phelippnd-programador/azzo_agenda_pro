export const shouldForceLogoutOnDashboardRetry = (
  errorMessage?: string | null,
  hasSessionHint = true
) => {
  const isAuthError = /sessao expirada|token invalido/i.test(errorMessage || "");
  return isAuthError && !hasSessionHint;
};
