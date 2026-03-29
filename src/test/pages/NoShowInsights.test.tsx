import { render, screen } from "@testing-library/react";
import { NoShowInsights } from "@/components/dashboard/NoShowInsights";
import type { Appointment, Client, Professional, Service } from "@/types";

describe("NoShowInsights", () => {
  it("should render dedicated analytics and operational no-show views", () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const clients: Client[] = [
      {
        id: "client-1",
        tenantId: "tenant-1",
        name: "Maria Silva",
        phone: "21999999999",
        email: "maria@example.com",
        createdAt: new Date(),
      } as Client,
    ];

    const professionals: Professional[] = [
      {
        id: "professional-1",
        tenantId: "tenant-1",
        userId: "user-1",
        name: "Phelipp Nascimento",
        email: "prof@example.com",
        phone: "21988888888",
        specialties: [],
        isActive: true,
        createdAt: new Date(),
      } as Professional,
    ];

    const services: Service[] = [
      {
        id: "service-1",
        tenantId: "tenant-1",
        name: "Corte",
        durationMinutes: 60,
        price: 100,
        isActive: true,
        createdAt: new Date(),
      } as Service,
    ];

    const appointments: Appointment[] = [
      {
        id: "appointment-1",
        tenantId: "tenant-1",
        clientId: "client-1",
        professionalId: "professional-1",
        serviceId: "service-1",
        date: new Date(currentYear, currentMonth, 10),
        startTime: "09:00",
        endTime: "10:00",
        status: "NO_SHOW",
        totalPrice: 100,
        createdAt: new Date(),
      },
      {
        id: "appointment-2",
        tenantId: "tenant-1",
        clientId: "client-1",
        professionalId: "professional-1",
        serviceId: "service-1",
        date: new Date(currentYear, currentMonth, 12),
        startTime: "10:00",
        endTime: "11:00",
        status: "COMPLETED",
        totalPrice: 100,
        createdAt: new Date(),
      },
    ];

    render(
      <NoShowInsights
        appointments={appointments}
        clients={clients}
        professionals={professionals}
        services={services}
      />
    );

    expect(screen.getByText("No-show no periodo")).toBeInTheDocument();
    expect(screen.getByText("Lista operacional de no-show")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 100,00").length).toBeGreaterThan(0);
    expect(screen.getByText("Nao compareceu")).toBeInTheDocument();
  });

  it("should render empty state when there are no no-shows in the current period", () => {
    const appointments: Appointment[] = [
      {
        id: "appointment-2",
        tenantId: "tenant-1",
        clientId: "client-1",
        professionalId: "professional-1",
        serviceId: "service-1",
        date: new Date(),
        startTime: "10:00",
        endTime: "11:00",
        status: "COMPLETED",
        totalPrice: 100,
        createdAt: new Date(),
      },
    ];

    render(
      <NoShowInsights
        appointments={appointments}
        clients={[]}
        professionals={[]}
        services={[]}
      />
    );

    expect(screen.getByText("Nenhum no-show registrado no periodo atual.")).toBeInTheDocument();
  });
});
