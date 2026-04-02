import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WhatsAppIntegrationCard } from "@/components/settings/WhatsAppIntegrationCard";

const {
  getWhatsAppConfigMock,
  getWhatsAppEmbeddedSignupStatusMock,
  saveWhatsAppConfigMock,
  testWhatsAppConnectionMock,
  completeWhatsAppEmbeddedSignupMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getWhatsAppConfigMock: vi.fn(),
  getWhatsAppEmbeddedSignupStatusMock: vi.fn(),
  saveWhatsAppConfigMock: vi.fn(),
  testWhatsAppConnectionMock: vi.fn(),
  completeWhatsAppEmbeddedSignupMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/services/whatsappService", () => ({
  getWhatsAppConfig: getWhatsAppConfigMock,
  getWhatsAppEmbeddedSignupStatus: getWhatsAppEmbeddedSignupStatusMock,
  saveWhatsAppConfig: saveWhatsAppConfigMock,
  testWhatsAppConnection: testWhatsAppConnectionMock,
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
    });
    saveWhatsAppConfigMock.mockResolvedValue({
      whatsappEnabled: true,
      accessTokenConfigured: true,
      webhookVerifyTokenConfigured: true,
      phoneNumberId: "phone-123",
      businessAccountId: "waba-456",
      webhookVerifyToken: "verify-token-123",
      onboardingStatus: "CONNECTED",
      tokenSource: "MANUAL",
      canSchedule: true,
      canCancel: true,
      canReschedule: true,
    });
    testWhatsAppConnectionMock.mockResolvedValue({
      success: true,
      message: "ok",
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

  it("deve permitir configurar o WhatsApp manualmente", async () => {
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

    const manualTab = await screen.findByRole("tab", { name: "Configuracao manual" });
    expect(manualTab).toBeInTheDocument();

    await user.click(manualTab);
    await user.click(screen.getAllByRole("switch")[0]);
    await user.type(await screen.findByLabelText("Access Token"), "token-manual-abc");
    await user.type(screen.getByLabelText("Phone Number ID"), "phone-123");
    await user.type(screen.getByLabelText("Business Account ID"), "waba-456");
    await user.click(screen.getByRole("button", { name: "Salvar Configuracao" }));

    await waitFor(() => {
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
