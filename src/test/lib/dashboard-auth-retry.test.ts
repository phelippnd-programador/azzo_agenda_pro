import { shouldForceLogoutOnDashboardRetry } from "@/lib/dashboard-auth-retry";

describe("shouldForceLogoutOnDashboardRetry", () => {
  it("should force logout when the error is auth-related and there is no local session hint", () => {
    expect(
      shouldForceLogoutOnDashboardRetry(
        "Sessao expirada ou token invalido. Faca login novamente.",
        false
      )
    ).toBe(true);
  });

  it("should keep retry flow when there is still a local session hint", () => {
    expect(
      shouldForceLogoutOnDashboardRetry(
        "Sessao expirada ou token invalido. Faca login novamente.",
        true
      )
    ).toBe(false);
  });

  it("should keep retry flow for non-auth errors", () => {
    expect(shouldForceLogoutOnDashboardRetry("Erro ao carregar dados", false)).toBe(false);
  });
});
