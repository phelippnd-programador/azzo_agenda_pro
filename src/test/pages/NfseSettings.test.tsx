import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NfseSettings from "@/pages/tax/NfseSettings";

const {
  getConfigMock,
  listProviderCapabilitiesMock,
  saveConfigMock,
  saveProviderCapabilitiesMock,
  listStatesMock,
  listMunicipalitiesMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  listProviderCapabilitiesMock: vi.fn(),
  saveConfigMock: vi.fn(),
  saveProviderCapabilitiesMock: vi.fn(),
  listStatesMock: vi.fn(),
  listMunicipalitiesMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => <div><h1>{title}</h1>{children}</div>,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    nfseApi: {
      ...actual.nfseApi,
      listStates: listStatesMock,
      listMunicipalities: listMunicipalitiesMock,
      getConfig: getConfigMock,
      listProviderCapabilities: listProviderCapabilitiesMock,
      saveConfig: saveConfigMock,
      saveProviderCapabilities: saveProviderCapabilitiesMock,
    },
  };
});

vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

describe("NfseSettings", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { ApiError } = await import("@/lib/api");
    getConfigMock.mockRejectedValue(new ApiError("Nao configurado", 404));
    listProviderCapabilitiesMock.mockResolvedValue([]);
    listStatesMock.mockResolvedValue([
      { codigoIbge: "33", uf: "RJ", nome: "Rio de Janeiro" },
      { codigoIbge: "35", uf: "SP", nome: "Sao Paulo" },
    ]);
    listMunicipalitiesMock.mockResolvedValue([
      { codigoIbge: "3304557", nome: "Rio de Janeiro", stateCodigoIbge: "33", stateUf: "RJ", stateNome: "Rio de Janeiro", codigoTom: "6001" },
    ]);
    saveConfigMock.mockImplementation(async (payload) => payload);
    saveProviderCapabilitiesMock.mockImplementation(async (payload) => payload);
  });

  it("should render unconfigured state for nfse config", async () => {
    render(
      <MemoryRouter initialEntries={["/configuracoes/fiscal/nfse"]}>
        <NfseSettings />
      </MemoryRouter>
    );

    expect(await screen.findByText("Configuracao NFS-e inicial pendente")).toBeInTheDocument();
    expect(screen.getByText("Capacidades do provedor")).toBeInTheDocument();
  });

  it("should save nfse config", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/configuracoes/fiscal/nfse"]}>
        <NfseSettings />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: /Salvar configuracao/i }));

    expect(saveConfigMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  });
});
