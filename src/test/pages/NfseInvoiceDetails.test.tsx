import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NfseInvoiceDetails from "@/pages/tax/NfseInvoiceDetails";

const {
  getInvoiceMock,
  getCertificateUnlockStatusMock,
  authorizeInvoiceMock,
  cancelInvoiceMock,
  createCertificateUnlockMock,
  revokeCertificateUnlockMock,
  toastSuccessMock,
  toastErrorMock,
  navigateMock,
} = vi.hoisted(() => ({
  getInvoiceMock: vi.fn(),
  getCertificateUnlockStatusMock: vi.fn(),
  authorizeInvoiceMock: vi.fn(),
  cancelInvoiceMock: vi.fn(),
  createCertificateUnlockMock: vi.fn(),
  revokeCertificateUnlockMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "invoice-1" }),
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    nfseApi: {
      ...actual.nfseApi,
      getInvoice: getInvoiceMock,
      getCertificateUnlockStatus: getCertificateUnlockStatusMock,
      authorizeInvoice: authorizeInvoiceMock,
      cancelInvoice: cancelInvoiceMock,
      createCertificateUnlock: createCertificateUnlockMock,
      revokeCertificateUnlock: revokeCertificateUnlockMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("NfseInvoiceDetails", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getInvoiceMock.mockResolvedValue({
      id: "invoice-1",
      fiscalStatus: "DRAFT",
      operationalStatus: "PENDING",
      numeroNfse: null,
      numeroRps: "1",
      valorServicos: 100,
      customer: { name: "Cliente Teste" },
    });
    getCertificateUnlockStatusMock.mockResolvedValue({ active: false, status: "INACTIVE" });
    authorizeInvoiceMock.mockResolvedValue(undefined);
    cancelInvoiceMock.mockResolvedValue(undefined);
    createCertificateUnlockMock.mockResolvedValue({ unlockTokenId: "token-1" });
    revokeCertificateUnlockMock.mockResolvedValue(undefined);
  });

  it("should redirect to nfse settings when authorization fails due to missing config", async () => {
    const { ApiError } = await import("@/lib/api");
    authorizeInvoiceMock.mockRejectedValue(
      new ApiError("fallback", 400, {
        code: "NFSE_PROVIDER_SEFIN_NACIONAL_CONFIG_MISSING",
        message: "Configuracao NFS-e nacional nao encontrada para o ambiente informado.",
      })
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NfseInvoiceDetails />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "Autorizar" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Configure a NFS-e deste ambiente antes de emitir a nota."
      );
      expect(navigateMock).toHaveBeenCalledWith("/configuracoes/fiscal/nfse");
    });
  });

  it("should redirect to fiscal tax settings when authorization fails due to missing issuer tax config", async () => {
    const { ApiError } = await import("@/lib/api");
    authorizeInvoiceMock.mockRejectedValue(
      new ApiError("fallback", 400, {
        code: "NFSE_PROVIDER_SEFIN_NACIONAL_TAX_CONFIG_MISSING",
        message: "Configuracao fiscal do emissor nao encontrada.",
      })
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NfseInvoiceDetails />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole("button", { name: "Autorizar" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Configure os dados fiscais do emitente antes de emitir a nota."
      );
      expect(navigateMock).toHaveBeenCalledWith("/configuracoes/fiscal/impostos");
    });
  });
});
