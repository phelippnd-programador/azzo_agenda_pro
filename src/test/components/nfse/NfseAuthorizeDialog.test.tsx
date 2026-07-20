import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NfseAuthorizeDialog } from "@/components/nfse/NfseAuthorizeDialog";

const { listProviderCapabilitiesMock } = vi.hoisted(() => ({
  listProviderCapabilitiesMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    nfseApi: { ...actual.nfseApi, listProviderCapabilities: listProviderCapabilitiesMock },
  };
});

function capability(provedor: string) {
  return {
    municipioCodigoIbge: "3304557",
    provedor,
    layoutVersion: "1",
    cancelSupported: true,
    cancelMode: "SYNC" as const,
  };
}

describe("NfseAuthorizeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seleciona automaticamente quando ha apenas um provedor disponivel", async () => {
    listProviderCapabilitiesMock.mockResolvedValue([capability("ABRASF")]);
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <NfseAuthorizeDialog
        open
        onOpenChange={() => {}}
        municipioCodigoIbge="3304557"
        isAuthorizing={false}
        errorMessage={null}
        onConfirm={onConfirm}
      />
    );

    await screen.findByText("Sera utilizado o provedor configurado para o municipio.", {
      exact: false,
    }).catch(() => undefined);
    await waitFor(() => expect(listProviderCapabilitiesMock).toHaveBeenCalled());

    await user.type(screen.getByLabelText("Senha do certificado"), "minhasenha");
    const confirmButton = await screen.findByRole("button", { name: /Emitir NFS-e/ });
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith({
      certificatePassword: "minhasenha",
      provedor: "ABRASF",
    });
  });

  it("exige escolha explicita quando ha mais de um provedor disponivel", async () => {
    listProviderCapabilitiesMock.mockResolvedValue([capability("ABRASF"), capability("SEFIN_NACIONAL")]);
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <NfseAuthorizeDialog
        open
        onOpenChange={() => {}}
        municipioCodigoIbge="3304557"
        isAuthorizing={false}
        errorMessage={null}
        onConfirm={onConfirm}
      />
    );

    await user.type(await screen.findByLabelText("Senha do certificado"), "minhasenha");
    const confirmButton = screen.getByRole("button", { name: /Emitir NFS-e/ });
    // sem escolher o provedor, o botao permanece desabilitado
    expect(confirmButton).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exibe erro sem fechar o dialogo e permite nova tentativa", async () => {
    listProviderCapabilitiesMock.mockResolvedValue([capability("ABRASF")]);
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <NfseAuthorizeDialog
        open
        onOpenChange={onOpenChange}
        municipioCodigoIbge="3304557"
        isAuthorizing={false}
        errorMessage="[NFSE_AUTH] Senha do certificado invalida."
        onConfirm={onConfirm}
      />
    );

    expect(await screen.findByText("Senha do certificado invalida.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("cancelar fecha o dialogo sem chamar onConfirm", async () => {
    listProviderCapabilitiesMock.mockResolvedValue([]);
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NfseAuthorizeDialog
        open
        onOpenChange={onOpenChange}
        isAuthorizing={false}
        errorMessage={null}
        onConfirm={onConfirm}
      />
    );

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exibe loading e desabilita acoes durante a emissao", async () => {
    listProviderCapabilitiesMock.mockResolvedValue([]);
    render(
      <NfseAuthorizeDialog
        open
        onOpenChange={() => {}}
        isAuthorizing
        errorMessage={null}
        onConfirm={vi.fn()}
      />
    );

    expect(await screen.findByText("Emitindo...")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha do certificado")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
