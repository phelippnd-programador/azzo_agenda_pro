import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicBooking from "@/pages/appointments/PublicBooking";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    publicBookingApi: {
      ...actual.publicBookingApi,
      getServices: vi.fn().mockResolvedValue([
        {
          id: "svc-1",
          name: "Corte",
          description: "Corte simples",
          duration: 45,
          price: 80,
          isActive: true,
          professionalIds: [],
        },
      ]),
      getProfessionals: vi.fn().mockResolvedValue([]),
      getAvailability: vi.fn().mockResolvedValue({ slots: [] }),
      createAppointment: vi.fn(),
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: vi.fn().mockResolvedValue([]),
    },
    professionalsApi: {
      ...actual.professionalsApi,
      getAll: vi.fn().mockResolvedValue([]),
    },
    appointmentsApi: {
      ...actual.appointmentsApi,
      create: vi.fn(),
    },
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PublicBooking", () => {
  it("should render available services for public booking", async () => {
    render(
      <MemoryRouter initialEntries={["/agendar/test-salao"]}>
        <Routes>
          <Route path="/agendar/:slug" element={<PublicBooking />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Corte")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*80,00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar/i })).toBeInTheDocument();
  });
});
