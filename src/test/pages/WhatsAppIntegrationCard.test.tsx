import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WhatsAppIntegrationCard } from "@/components/settings/WhatsAppIntegrationCard";

const {
  getWhatsAppConfigMock,
  getWhatsAppEmbeddedSignupStatusMock,
  saveWhatsAppConfigMock,
  testWhatsAppConnectionMock,
  validateWhatsAppConnectionMock,
  sendWhatsAppTestMessageMock,
  completeWhatsAppEmbeddedSignupMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getWhatsAppConfigMock: vi.fn(),
  getWhatsAppEmbeddedSignupStatusMock: vi.fn(),
  saveWhatsAppConfigMock: vi.fn(),
  testWhatsAppConnectionMock: vi.fn(),
  validateWhatsAppConnectionMock: vi.fn(),
  sendWhatsAppTestMessageMock: vi.fn(),
  completeWhatsAppEmbeddedSignupMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/services/whatsappService", () => ({
  getWhatsAppConfig: getWhatsAppConfigMock,
  getWhatsAppEmbeddedSignupStatus: getWhatsAppEmbeddedSignupStatusMock,
  saveWhatsAppConfig: saveWhatsAppConfigMock,
  testWhatsAppConnection: testWhatsAppConnectionMock,
  validateWhatsAppConnection: validateWhatsAppConnectionMock,
  sendWhatsAppTestMessage: sendWhatsAppTestMessageMock,
  completeWhatsAppEmbeddedSignup: completeWhatsAppEmbeddedSignupMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("WhatsAppIntegrationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWhatsAppConfigMock.mockResolvedValue({
      whatsappEnabled: false,
      accessTokenConfigured: false,
      webhookVerifyTokenConfigured: true,
      phoneNumberId: "",
      businessAccountId: "",
      webhookVerifyToken: "verify-token-123",
      onboardingStatus: "NOT_STARTED",
      tokenSource: "MANUAL",
      embeddedSignupEnabled: false,
      canSchedule: true,
      canCancel: true,
      canReschedule: true,
    });
    getWhatsAppEmbeddedSignupStatusMock.mockResolvedValue({
      connected: false,
      whatsappEnabled: false,
      accessTokenConfigured: false,
      webhookVerifyTokenConfigured: true,
      webhookVerifyToken: "verify-token-123",
      onboardingStatus: "NOT_STARTED",
      tokenSource: "MANUAL",
      embeddedSignupEnabled: false,
    });
    saveWhatsAppConfigMock.mockResolvedValue({
      whatsappEnabled: true,
      accessTokenConfigured: true,
      webhookVerifyTokenConfigured: true,
      phoneNumberId: "phone-123",
      businessAccountId: "waba-456",
      embeddedSignupEnabled: false,
      webhookVerifyToken: "verify-token-123",
      onboardingStatus: "CONNECTED",
      tokenSource: "MANUAL",
      canSchedule: true,
      canCancel: true,
      canReschedule: true,
    });
    validateWhatsAppConnectionMock.mockResolvedValue({
      success: true,
      message: "Conexao com a Meta validada com sucesso.",
      phoneNumberId: "phone-123",
      displayPhoneNumber: "5511999999999",
      verifiedName: "Azzo Agenda",
    });
    testWhatsAppConnectionMock.mockResolvedValue({
      success: true,
      message: "ok",
    });
    sendWhatsAppTestMessageMock.mockResolvedValue({
      success: true,
      message: "Mensagem de teste enviada com sucesso.",
      providerMessageId: "wamid.TESTE123",
    });
    completeWhatsAppEmbeddedSignupMock.mockResolvedValue({
      connected: true,
      whatsappEnabled: true,
      accessTokenConfigured: true,
      webhookVerifyTokenConfigured: true,
      webhookVerifyToken: "verify-token-123",
      onboardingStatus: "CONNECTED",
      tokenSource: "EMBEDDED_CODE_EXCHANGE",
    });
  });

  it("deve permitir configurar o WhatsApp pelo wizard", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <WhatsAppIntegrationCard />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Etapa 1 de 7: Verificacao inicial")).toBeInTheDocument();
    await user.click(screen.getAllByRole("switch")[0]);

    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));
    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));
    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));

    await user.type(screen.getByLabelText("WABA / Business Account ID"), "waba-456");
    await user.type(screen.getByLabelText("Phone Number ID"), "phone-123");
    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));

    await user.type(await screen.findByLabelText("Access Token"), "token-manual-abc");
    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));
    await screen.findByDisplayValue(/webhook\/whatsapp/i);
    await user.click(screen.getByRole("button", { name: /Proxima etapa/i }));
    await user.click(screen.getByRole("button", { name: /Validar com a Meta/i }));
    await user.click(screen.getByRole("button", { name: "Salvar Configuracao" }));

    await waitFor(() => {
      expect(validateWhatsAppConnectionMock).toHaveBeenCalledWith({
        accessToken: "token-manual-abc",
        phoneNumberId: "phone-123",
      });
      expect(saveWhatsAppConfigMock).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsappEnabled: true,
          accessToken: "token-manual-abc",
          phoneNumberId: "phone-123",
          businessAccountId: "waba-456",
        })
      );
    });
  }, 15000);
});
