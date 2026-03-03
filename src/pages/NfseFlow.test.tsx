import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import NfseInvoices from "@/pages/NfseInvoices";
import NfseInvoiceForm from "@/pages/NfseInvoiceForm";
import NfseInvoiceDetails from "@/pages/NfseInvoiceDetails";

const navigateMock = vi.fn();

const {
  listInvoicesMock,
  createInvoiceMock,
  getInvoiceMock,
  getCertificateUnlockStatusMock,
  authorizeInvoiceMock,
} = vi.hoisted(() => ({
  listInvoicesMock: vi.fn(),
  createInvoiceMock: vi.fn(),
  getInvoiceMock: vi.fn(),
  getCertificateUnlockStatusMock: vi.fn(),
  authorizeInvoiceMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    nfseApi: {
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      listInvoices: listInvoicesMock,
      getInvoice: getInvoiceMock,
      createInvoice: createInvoiceMock,
      updateInvoice: vi.fn(),
      authorizeInvoice: authorizeInvoiceMock,
      cancelInvoice: vi.fn(),
      requestInvoicePdfJob: vi.fn(),
      getInvoicePdfJobStatus: vi.fn(),
      downloadInvoicePdfJob: vi.fn(),
      createCertificateUnlock: vi.fn(),
      getCertificateUnlockStatus: getCertificateUnlockStatusMock,
      revokeCertificateUnlock: vi.fn(),
      listProviderCapabilities: vi.fn(),
      saveProviderCapabilities: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: unknown }) => <div>{children as any}</div>,
}));

describe("NFS-e main flow pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads NFS-e list and filters by search text", async () => {
    listInvoicesMock.mockResolvedValue({
      items: [
        {
          id: "nfse-1",
          numeroNfse: "1001",
          numeroRps: 5001,
          fiscalStatus: "AUTHORIZED",
          customer: { name: "Cliente A" },
        },
        {
          id: "nfse-2",
          numeroNfse: "1002",
          numeroRps: 5002,
          fiscalStatus: "DRAFT",
          customer: { name: "Cliente B" },
        },
      ],
      total: 2,
      page: 1,
      pageSize: 100,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/fiscal/nfse"]}>
        <NfseInvoices />
      </MemoryRouter>
    );

    expect(await screen.findByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("Cliente B")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Buscar por numero/i), "Cliente B");
    expect(screen.queryByText("Cliente A")).not.toBeInTheDocument();
    expect(screen.getByText("Cliente B")).toBeInTheDocument();
  });

  it("creates draft from form using selected NBS helper code", async () => {
    createInvoiceMock.mockResolvedValue({ id: "nfse-created-1" });
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter initialEntries={["/fiscal/nfse/nova"]}>
        <NfseInvoiceForm />
      </MemoryRouter>
    );

    const inputs = Array.from(container.querySelectorAll("input"));
    await user.clear(inputs[3] as HTMLInputElement);
    await user.type(inputs[3] as HTMLInputElement, "Cliente Fluxo");
    await user.clear(inputs[4] as HTMLInputElement);
    await user.type(inputs[4] as HTMLInputElement, "12345678901");
    await user.clear(inputs[5] as HTMLInputElement);
    await user.type(inputs[5] as HTMLInputElement, "Corte teste");
    await user.clear(inputs[6] as HTMLInputElement);
    await user.type(inputs[6] as HTMLInputElement, "1");
    await user.clear(inputs[7] as HTMLInputElement);
    await user.type(inputs[7] as HTMLInputElement, "99");

    await user.type(screen.getByPlaceholderText("Digite codigo ou descricao NBS"), "barbearia");
    await user.click(screen.getByRole("button", { name: "Usar" }));

    await user.click(screen.getByRole("button", { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(createInvoiceMock).toHaveBeenCalledTimes(1);
    });
    expect(createInvoiceMock.mock.calls[0]?.[0]?.codigoTributacaoMunicipio).toBe("060101");
    expect(navigateMock).toHaveBeenCalledWith("/fiscal/nfse/nfse-created-1");
  });

  it("authorizes using unlock token when password is empty", async () => {
    getInvoiceMock.mockResolvedValue({
      id: "nfse-123",
      fiscalStatus: "DRAFT",
      numeroRps: 9001,
      customer: { name: "Cliente Aut" },
      valorServicos: 120,
    });
    getCertificateUnlockStatusMock.mockResolvedValue({
      active: true,
      unlockTokenId: "unlock-123",
      status: "ACTIVE",
    });
    authorizeInvoiceMock.mockResolvedValue({ id: "nfse-123", fiscalStatus: "AUTHORIZED" });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/fiscal/nfse/nfse-123"]}>
        <Routes>
          <Route path="/fiscal/nfse/:id" element={<NfseInvoiceDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Cliente Aut/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Autorizar" }));

    await waitFor(() => {
      expect(authorizeInvoiceMock).toHaveBeenCalledWith("nfse-123", {
        certificatePassword: undefined,
        unlockTokenId: "unlock-123",
      });
    });
  });
});
