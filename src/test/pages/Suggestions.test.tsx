import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SuggestionsPage from "@/pages/Suggestions";

const { listMock, createMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
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
    suggestionsApi: {
      ...actual.suggestionsApi,
      list: listMock,
      create: createMock,
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

describe("SuggestionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue({
      items: [{
        id: "sug-1",
        title: "Melhorar agenda",
        message: "Adicionar atalho",
        category: "MELHORIA",
        status: "OPEN",
        userName: "Owner QA",
        sourcePage: "/agenda",
        createdAt: new Date().toISOString(),
      }],
    });
    createMock.mockResolvedValue({ id: "sug-2" });
  });

  it("should render form and existing suggestions", async () => {
    render(
      <MemoryRouter initialEntries={["/sugestoes"]}>
        <SuggestionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nova sugestao")).toBeInTheDocument();
    expect(screen.getByText("Melhorar agenda")).toBeInTheDocument();
  });

  it("should submit a suggestion", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/sugestoes"]}>
        <SuggestionsPage />
      </MemoryRouter>
    );

    await screen.findByText("Nova sugestao");
    await user.type(screen.getByPlaceholderText("Titulo da sugestao"), "Novo fluxo");
    await user.type(screen.getByPlaceholderText("Descreva sua sugestao..."), "Melhorar o cadastro");
    await user.click(screen.getByRole("button", { name: /Enviar sugestao/i }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });
    expect(toastSuccessMock).toHaveBeenCalled();
  });
});
