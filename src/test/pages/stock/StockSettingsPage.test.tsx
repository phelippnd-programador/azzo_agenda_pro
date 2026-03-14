import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockSettingsPage from "@/pages/stock/StockSettingsPage";

const { getSettingsMock, updateSettingsMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  updateSettingsMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    stockApi: {
      getSettings: getSettingsMock,
      updateSettings: updateSettingsMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StockSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save stock settings", async () => {
    getSettingsMock.mockResolvedValue({
      alertaEstoqueMinimoAtivo: true,
      bloquearSaidaSemSaldo: true,
      permitirAjusteNegativoComPermissao: false,
      diasCoberturaMeta: 15,
      updatedAt: new Date().toISOString(),
    });
    updateSettingsMock.mockResolvedValue({
      alertaEstoqueMinimoAtivo: false,
      bloquearSaidaSemSaldo: true,
      permitirAjusteNegativoComPermissao: false,
      diasCoberturaMeta: 20,
      updatedAt: new Date().toISOString(),
    });
    const user = userEvent.setup();

    render(<StockSettingsPage />);

    expect(await screen.findByText("Configuracoes de estoque")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Ativar alerta de estoque minimo" }));
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "20");
    await user.click(screen.getByRole("button", { name: "Salvar configuracoes" }));

    await waitFor(() => {
      expect(updateSettingsMock).toHaveBeenCalled();
    });
  });
});
