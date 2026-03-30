import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NoShowReport from "@/pages/NoShowReport";

const {
  getNoShowReportMock,
  exportNoShowReportMock,
  getProfessionalsMock,
  getServicesMock,
} = vi.hoisted(() => ({
  getNoShowReportMock: vi.fn(),
  exportNoShowReportMock: vi.fn(),
  getProfessionalsMock: vi.fn(),
  getServicesMock: vi.fn(),
}));

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      getNoShowReport: getNoShowReportMock,
      exportNoShowReport: exportNoShowReportMock,
    },
    professionalsApi: {
      ...actual.professionalsApi,
      getAll: getProfessionalsMock,
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: getServicesMock,
    },
  };
});

describe("NoShowReport", () => {
  const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL");
  const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL");

  beforeEach(() => {
    getProfessionalsMock.mockResolvedValue({
      items: [{ id: "prof-1", name: "Maria", isActive: true }],
    });
    getServicesMock.mockResolvedValue({
      items: [{ id: "service-1", name: "Corte", isActive: true }],
    });
    getNoShowReportMock.mockResolvedValue({
      limit: 20,
      afterId: null,
      nextAfterId: "next-id",
      hasMore: true,
      totalItems: 2,
      items: [
        {
          appointmentId: "app-1",
          clientName: "Ana Souza",
          clientPhone: "21999999999",
          clientEmail: "ana@example.com",
          professionalName: "Maria",
          serviceNames: ["Corte"],
          totalServices: 1,
          totalPrice: 100,
          status: "NO_SHOW",
          date: "2026-03-25",
          startTime: "09:00",
          endTime: "10:00",
          notes: "Cliente nao compareceu",
          createdAt: "2026-03-25T08:00:00Z",
        },
      ],
    });
    exportNoShowReportMock.mockResolvedValue(new Blob(["csv"], { type: "text/csv" }));
    createObjectUrlSpy.mockReturnValue("blob:test");
    revokeObjectUrlSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render report page and paginate by afterId", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/no-show"]}>
        <NoShowReport />
      </MemoryRouter>
    );

    expect(await screen.findByText("Relatorio de no-show")).toBeInTheDocument();
    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(getNoShowReportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        afterId: undefined,
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));

    await waitFor(() => {
      expect(getNoShowReportMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          afterId: "next-id",
        })
      );
    });
  });

  it("should export filtered data", async () => {
    render(
      <MemoryRouter initialEntries={["/relatorio/no-show"]}>
        <NoShowReport />
      </MemoryRouter>
    );

    await screen.findByText("Ana Souza");
    fireEvent.click(screen.getByRole("button", { name: /Baixar dados/i }));

    await waitFor(() => {
      expect(exportNoShowReportMock).toHaveBeenCalled();
      expect(createObjectUrlSpy).toHaveBeenCalled();
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:test");
    });
  });
});
