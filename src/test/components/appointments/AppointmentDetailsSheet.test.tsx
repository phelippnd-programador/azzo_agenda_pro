import { render, screen, waitFor } from '@testing-library/react';
import { AppointmentDetailsSheet } from '@/components/appointments/AppointmentDetailsSheet';

const { addCustomerNoteMock, getAppointmentHistoryMock } = vi.hoisted(() => ({
  addCustomerNoteMock: vi.fn(),
  getAppointmentHistoryMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  appointmentsApi: {
    addCustomerNote: addCustomerNoteMock,
  },
  clientsApi: {
    getAppointmentHistory: getAppointmentHistoryMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AppointmentDetailsSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAppointmentHistoryMock.mockResolvedValue({
      items: [],
    });
  });

  it('should show gross, discount and net values per appointment item', async () => {
    render(
      <AppointmentDetailsSheet
        open
        onOpenChange={vi.fn()}
        appointment={{
          id: 'appointment-1',
          tenantId: 'tenant-1',
          clientId: 'client-1',
          professionalId: 'professional-1',
          date: new Date('2026-04-24T12:00:00'),
          startTime: '09:00',
          endTime: '10:00',
          status: 'COMPLETED',
          totalPrice: 85,
          createdAt: new Date('2026-04-24T12:00:00'),
          items: [
            {
              id: 'item-1',
              serviceId: 'service-1',
              durationMinutes: 60,
              unitPrice: 100,
              grossAmount: 100,
              discountAmount: 15,
              totalPrice: 85,
            },
          ],
        }}
        professionals={[
          {
            id: 'professional-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            name: 'Profissional QA',
            email: 'pro@qa.com',
            phone: '11999999998',
            specialties: ['Corte'],
            commissionRate: 40,
            workingHours: [],
            isActive: true,
            createdAt: new Date('2026-04-24T12:00:00'),
          },
        ]}
        services={[
          {
            id: 'service-1',
            tenantId: 'tenant-1',
            name: 'Corte QA',
            description: 'Servico com desconto',
            duration: 60,
            price: 100,
            category: 'Corte',
            professionalIds: ['professional-1'],
            isActive: true,
            createdAt: new Date('2026-04-24T12:00:00'),
          },
        ]}
        clients={[
          {
            id: 'client-1',
            tenantId: 'tenant-1',
            name: 'Cliente QA',
            email: 'cliente@qa.com',
            phone: '11999999999',
            totalVisits: 3,
            totalSpent: 250,
            createdAt: new Date('2026-04-24T12:00:00'),
          },
        ]}
        isProfessionalUser={false}
        canReassignAppointments
        onStatusChange={vi.fn().mockResolvedValue(undefined)}
        onDeleteRequest={vi.fn()}
        onReassignRequest={vi.fn()}
        onViewInvoice={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getAppointmentHistoryMock).toHaveBeenCalledWith('client-1', 0, 50);
    });

    expect(screen.getByText(/Desconto aplicado:/i)).toBeInTheDocument();
    expect(screen.getByText(/Liquido do item:/i)).toBeInTheDocument();
    expect(screen.getAllByText((_, element) => element?.textContent === "R$\u00A0100,00").length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => element?.textContent === "- R$\u00A015,00").length).toBeGreaterThan(0);
    expect(screen.getAllByText((_, element) => element?.textContent === "R$\u00A085,00").length).toBeGreaterThan(0);
  });
});
