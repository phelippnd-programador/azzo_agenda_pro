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
          totalPrice: 8500,
          createdAt: new Date('2026-04-24T12:00:00'),
          items: [
            {
              id: 'item-1',
              serviceId: 'service-1',
              durationMinutes: 60,
              unitPrice: 10000,
              grossAmount: 10000,
              discountAmount: 1500,
              totalPrice: 8500,
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
            price: 10000,
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
            totalSpent: 25000,
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
    expect(screen.getAllByText(/R\$\s*100,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-\s*R\$\s*15,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*85,00/).length).toBeGreaterThan(0);
  });
});
