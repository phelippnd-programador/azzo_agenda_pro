import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "@/pages/Settings";

const {
  updateNotificationsMock,
  updateMeMock,
  getMfaStatusMock,
  getSettingsMock,
  getAppointmentSettingsMock,
  updateAppointmentSettingsMock,
  setupMfaMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  updateNotificationsMock: vi.fn(),
  updateMeMock: vi.fn(),
  getMfaStatusMock: vi.fn(),
  getSettingsMock: vi.fn(),
  getAppointmentSettingsMock: vi.fn(),
  updateAppointmentSettingsMock: vi.fn(),
  setupMfaMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => <div><h1>{title}</h1>{children}</div>,
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc") },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "owner-1", role: "OWNER", name: "Owner QA", email: "owner@qa.local" },
  }),
}));

vi.mock("@/contexts/MenuPermissionsContext", () => ({
  useMenuPermissions: () => ({
    allowedRoutes: [
      "/configuracoes/integracoes/whatsapp",
      "/configuracoes/estoque",
      "/configuracoes/fiscal/impostos",
      "/configuracoes/fiscal/certificados",
      "/configuracoes/fiscal/nfse",
      "/fiscal/nfse",
      "/perfil-salao",
    ],
    canAccess: (route: string) => route === "/perfil-salao",
  }),
}));

vi.mock("@/lib/cookie-consent", () => ({
  hasNonEssentialCookieConsent: () => true,
  readCookieConsent: () => ({ expiresAt: new Date("2026-04-01T00:00:00Z").toISOString() }),
  revokeCookieConsent: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    settingsApi: {
      ...actual.settingsApi,
      get: getSettingsMock,
      updateNotifications: updateNotificationsMock,
    },
    appointmentsApi: {
      ...actual.appointmentsApi,
      getSettings: getAppointmentSettingsMock,
      updateSettings: updateAppointmentSettingsMock,
    },
    usersApi: {
      ...actual.usersApi,
      updateMe: updateMeMock,
      getMfaStatus: getMfaStatusMock,
      setupMfa: setupMfaMock,
      updatePassword: vi.fn().mockResolvedValue(undefined),
      enableMfa: vi.fn().mockResolvedValue({ enabled: true, enrolled: true }),
      disableMfa: vi.fn().mockResolvedValue({ enabled: false, enrolled: false }),
    },
  };
});

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingsMock.mockResolvedValue({ notifications: { emailNotifications: true, smsNotifications: true, whatsappNotifications: true, reminderHours: 24 } });
    getAppointmentSettingsMock.mockResolvedValue({ allowConflictingAppointmentsOnManualScheduling: false });
    updateAppointmentSettingsMock.mockResolvedValue({ allowConflictingAppointmentsOnManualScheduling: false });
    getMfaStatusMock.mockResolvedValue({ enabled: false, enrolled: false });
    updateNotificationsMock.mockResolvedValue(undefined);
    updateMeMock.mockResolvedValue(undefined);
    setupMfaMock.mockResolvedValue({ secret: "SECRET123", otpauthUri: "otpauth://totp/Azzo" });
  });

  it("should render settings tabs based on permissions", async () => {
    render(
      <MemoryRouter initialEntries={["/configuracoes?tab=notifications"]}>
        <Settings />
      </MemoryRouter>
    );

    expect(await screen.findByRole("tab", { name: "Notificacoes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Integracoes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fiscal" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Perfil do Salao" })).toBeInTheDocument();
  });

  it("should save notifications settings", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/configuracoes?tab=notifications"]}>
        <Settings />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /^Salvar$/i }));

    expect(updateNotificationsMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  });
});
