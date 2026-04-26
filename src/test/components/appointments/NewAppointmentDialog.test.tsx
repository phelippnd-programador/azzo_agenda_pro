import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NewAppointmentDialog } from '@/components/appointments/NewAppointmentDialog';

const { getSettingsMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({
    clients: [
      {
        id: 'client-1',
        name: 'Cliente QA',
        phone: '11999999999',
        email: 'cliente@qa.com',
      },
    ],
    createClient: vi.fn(),
  }),
}));

vi.mock('@/hooks/useServices', () => ({
  useServices: () => ({
    services: [
      {
        id: 'service-1',
        tenantId: 'tenant-1',
        name: 'Corte QA',
        description: 'Servico interno',
        duration: 60,
        price: 10000,
        category: 'Corte',
        professionalIds: ['professional-1'],
        isActive: true,
        createdAt: new Date('2026-04-24T12:00:00'),
      },
    ],
  }),
}));

vi.mock('@/hooks/useAvailableSlots', () => ({
  useAvailableSlots: () => ({
    slots: [
      {
        startTime: '09:00',
        endTime: '10:00',
        optimizationScore: 1,
        conflicting: false,
        slotType: 'AVAILABLE',
      },
    ],
    isLoading: false,
    error: null,
    canFetch: true,
  }),
}));

vi.mock('@/components/clients/ClientUpsertDialog', () => ({
  ClientUpsertDialog: () => null,
}));

vi.mock('@/components/common/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/lib/api', () => ({
  appointmentsApi: {
    getSettings: getSettingsMock,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

describe('NewAppointmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettingsMock.mockResolvedValue({
      allowConflictingAppointmentsOnManualScheduling: false,
    });
  });

  it('should send gross, discount and net amounts in internal manual scheduling', async () => {
    const createAppointment = vi.fn().mockResolvedValue(undefined);

    render(
      <NewAppointmentDialog
        open
        onOpenChange={vi.fn()}
        currentDate={new Date('2026-04-24T12:00:00')}
        isProfessionalUser
        loggedProfessional={{
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
        }}
        activeProfessionals={[
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
        createAppointment={createAppointment}
      />,
    );

    await waitFor(() => {
      expect(getSettingsMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cliente QA/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    fireEvent.click(screen.getByRole('button', { name: /Corte QA/i }));

    const discountInput = screen.getByLabelText(/Desconto opcional/i);
    fireEvent.change(discountInput, { target: { value: '10,00' } });

    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));
    fireEvent.click(screen.getByRole('button', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Revise antes de criar/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar agendamento/i }));

    await waitFor(() => {
      expect(createAppointment).toHaveBeenCalledWith({
        clientId: 'client-1',
        professionalId: 'professional-1',
        date: '2026-04-24',
        startTime: '09:00',
        endTime: '10:00',
        status: 'PENDING',
        totalPrice: 9000,
        items: [
          {
            serviceId: 'service-1',
            durationMinutes: 60,
            unitPrice: 10000,
            grossAmount: 10000,
            discountAmount: 1000,
            totalPrice: 9000,
          },
        ],
        origin: 'INTERNAL_MANUAL',
        allowConflict: false,
        conflictAcknowledged: false,
      });
    });
  }, 15000);
});
