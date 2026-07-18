import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TelegramIntegrationCard } from "@/components/settings/TelegramIntegrationCard";

const {
  getConfigMock,
  saveConfigMock,
  testConnectionMock,
  validateConnectionMock,
  sendTestMessageMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  saveConfigMock: vi.fn(),
  testConnectionMock: vi.fn(),
  validateConnectionMock: vi.fn(),
  sendTestMessageMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/lib/api/telegram", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/telegram")>("@/lib/api/telegram");
  return {
    ...actual,
    telegramApi: {
      getConfig: getConfigMock,
      saveConfig: saveConfigMock,
      testConnection: testConnectionMock,
      validateConnection: validateConnectionMock,
      sendTestMessage: sendTestMessageMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("TelegramIntegrationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConfigMock.mockResolvedValue({
      botUsername: "",
      botTokenConfigured: false,
      webhookSecretTokenConfigured: false,
      telegramEnabled: false,
      inboundWebhookUrl: "https://app.exemplo.com.br/webhook/telegram/tenant-1",
      webhook: null,
    });
    validateConnectionMock.mockResolvedValue({
      success: true,
      message: "Conexao com o Telegram validada com sucesso.",
      botUsername: "meu_salao_bot",
      botDisplayName: "Meu Salao",
    });
    saveConfigMock.mockResolvedValue({
      botUsername: "meu_salao_bot",
      botTokenConfigured: true,
      webhookSecretTokenConfigured: true,
      telegramEnabled: false,
      inboundWebhookUrl: "https://app.exemplo.com.br/webhook/telegram/tenant-1",
      webhook: { configured: true, pendingUpdateCount: 0 },
    });
    testConnectionMock.mockResolvedValue({ success: true, telegramEnabled: true, message: "ok" });
    sendTestMessageMock.mockResolvedValue({ success: true, message: "enviada", providerMessageId: "42" });
  });

  it("carrega a configuracao e exibe estado nao conectado", async () => {
    render(<TelegramIntegrationCard />);
    expect(await screen.findByText("Nao conectado")).toBeInTheDocument();
    expect(screen.getByText(/@BotFather/)).toBeInTheDocument();
    await waitFor(() => expect(getConfigMock).toHaveBeenCalled());
  });

  it("valida o token e salva a configuracao", async () => {
    const user = userEvent.setup();
    render(<TelegramIntegrationCard />);

    const tokenInput = await screen.findByLabelText("Token do bot");
    await user.type(tokenInput, "123456:ABCdef");

    await user.click(screen.getByRole("button", { name: /Validar token/i }));
    await waitFor(() =>
      expect(validateConnectionMock).toHaveBeenCalledWith({ botToken: "123456:ABCdef" })
    );

    await user.click(screen.getByRole("button", { name: /Salvar configuracao/i }));
    await waitFor(() =>
      expect(saveConfigMock).toHaveBeenCalledWith(
        expect.objectContaining({
          botToken: "123456:ABCdef",
          telegramEnabled: false,
        })
      )
    );
  });
});
