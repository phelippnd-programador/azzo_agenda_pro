import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UserProfile from "@/pages/UserProfile";

const {
  updateMeMock,
  updatePasswordMock,
  getMfaStatusMock,
  setupMfaMock,
  enableMfaMock,
  disableMfaMock,
  uploadAvatarMock,
  removeAvatarMock,
  prepareImageUploadMock,
  refreshUserMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  updateMeMock: vi.fn(),
  updatePasswordMock: vi.fn(),
  getMfaStatusMock: vi.fn(),
  setupMfaMock: vi.fn(),
  enableMfaMock: vi.fn(),
  disableMfaMock: vi.fn(),
  uploadAvatarMock: vi.fn(),
  removeAvatarMock: vi.fn(),
  prepareImageUploadMock: vi.fn(),
  refreshUserMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,abc") },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "owner-1",
      role: "OWNER",
      name: "Owner QA",
      email: "owner@qa.local",
      phone: "11999999999",
      salonName: "Salao QA",
      avatarUrl: "https://cdn.qa.local/avatar.webp",
      createdAt: "2026-04-01T00:00:00Z",
    },
    refreshUser: refreshUserMock,
  }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    usersApi: {
      ...actual.usersApi,
      updateMe: updateMeMock,
      updatePassword: updatePasswordMock,
      getMfaStatus: getMfaStatusMock,
      setupMfa: setupMfaMock,
      enableMfa: enableMfaMock,
      disableMfa: disableMfaMock,
      uploadAvatar: uploadAvatarMock,
      removeAvatar: removeAvatarMock,
    },
  };
});

vi.mock("@/lib/image-upload", () => ({
  prepareImageUpload: prepareImageUploadMock,
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

describe("UserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMfaStatusMock.mockResolvedValue({ enabled: false, enrolled: false });
    updateMeMock.mockResolvedValue({
      id: "owner-1",
      tenantId: "tenant-1",
      name: "Owner QA",
      email: "owner@qa.local",
      phone: "11999999999",
      role: "OWNER",
      avatar: "tenant/tenant-1/users/owner-1/avatar/avatar.webp",
      avatarUrl: "https://cdn.qa.local/avatar.webp",
      salonName: "Salao QA",
      createdAt: "2026-04-01T00:00:00Z",
    });
    updatePasswordMock.mockResolvedValue(undefined);
    setupMfaMock.mockResolvedValue({ secret: "SECRET123", otpauthUri: "otpauth://totp/Azzo", issuer: "Azzo", accountName: "owner@qa.local" });
    enableMfaMock.mockResolvedValue({ enabled: true, enrolled: true });
    disableMfaMock.mockResolvedValue({ enabled: false, enrolled: false });
    uploadAvatarMock.mockResolvedValue({
      avatar: "tenant/tenant-1/users/owner-1/avatar/avatar.webp",
      avatarUrl: "https://cdn.qa.local/avatar.webp",
    });
    removeAvatarMock.mockResolvedValue({
      avatar: null,
      avatarUrl: null,
    });
    prepareImageUploadMock.mockImplementation(async (file: File) => file);
    refreshUserMock.mockResolvedValue({
      id: "owner-1",
      role: "OWNER",
      name: "Owner QA",
      email: "owner@qa.local",
    });
  });

  it("should render profile data", async () => {
    render(
      <MemoryRouter initialEntries={["/perfil-usuario"]}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue("Owner QA")).toBeInTheDocument();
    expect(screen.getByDisplayValue("owner@qa.local")).toBeInTheDocument();
    expect(screen.getByDisplayValue("11999999999")).toBeInTheDocument();
  });

  it("should save user profile", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/perfil-usuario"]}>
        <UserProfile />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Salvar perfil/i }));

    await waitFor(() => {
      expect(updateMeMock).toHaveBeenCalledWith({
        name: "Owner QA",
        email: "owner@qa.local",
        phone: "11999999999",
      });
    });
    expect(refreshUserMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Perfil atualizado com sucesso");
  });

  it("should upload avatar", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/perfil-usuario"]}>
        <UserProfile />
      </MemoryRouter>
    );

    const input = await screen.findByTestId("user-avatar-input");
    const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(prepareImageUploadMock).toHaveBeenCalledWith(file);
      expect(uploadAvatarMock).toHaveBeenCalled();
    });
    expect(refreshUserMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Foto de perfil atualizada com sucesso");
  });

  it("should remove avatar", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/perfil-usuario"]}>
        <UserProfile />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Remover imagem/i }));

    await waitFor(() => {
      expect(removeAvatarMock).toHaveBeenCalled();
    });
    expect(refreshUserMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Foto de perfil removida com sucesso");
  });
});
