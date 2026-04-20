import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicBooking from '@/pages/appointments/PublicBooking';

const mocks = vi.hoisted(() => ({
  getServices: vi.fn(),
  getProfessionals: vi.fn(),
  getAvailability: vi.fn(),
  createAppointment: vi.fn(),
  getPublicBySlug: vi.fn(),
  getAllServices: vi.fn(),
  getAllProfessionals: vi.fn(),
  createAppointmentInternal: vi.fn(),
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    publicBookingApi: {
      ...actual.publicBookingApi,
      getServices: mocks.getServices,
      getProfessionals: mocks.getProfessionals,
      getAvailability: mocks.getAvailability,
      createAppointment: mocks.createAppointment,
    },
    salonApi: {
      ...actual.salonApi,
      getPublicBySlug: mocks.getPublicBySlug,
    },
    servicesApi: {
      ...actual.servicesApi,
      getAll: mocks.getAllServices,
    },
    professionalsApi: {
      ...actual.professionalsApi,
      getAll: mocks.getAllProfessionals,
    },
    appointmentsApi: {
      ...actual.appointmentsApi,
      create: mocks.createAppointmentInternal,
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PublicBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublicBySlug.mockResolvedValue({
      salonName: 'Studio Azzo',
      logoUrl: null,
      logo: null,
    });
    mocks.getServices.mockResolvedValue([
      {
        id: 'svc-1',
        name: 'Corte',
        description: 'Corte simples',
        duration: 45,
        price: 8000,
        isActive: true,
        professionalIds: [],
      },
      {
        id: 'svc-2',
        name: 'Escova',
        description: 'Escova modelada',
        duration: 30,
        price: 6000,
        isActive: true,
        professionalIds: [],
      },
    ]);
    mocks.getProfessionals.mockResolvedValue([
      {
        id: 'pro-1',
        name: 'Ana Souza',
        avatar: '',
        specialties: ['Cortes', 'Escovas'],
        isActive: true,
      },
    ]);
    mocks.getAvailability.mockResolvedValue({
      slots: [
        { time: '09:00', available: true },
        { time: '09:30', available: true },
      ],
    });
    mocks.getAllServices.mockResolvedValue([]);
    mocks.getAllProfessionals.mockResolvedValue([]);
    mocks.createAppointmentInternal.mockResolvedValue(undefined);
  });

  it('should render the public booking shell with persistent summary', async () => {
    render(
      <MemoryRouter initialEntries={['/agendar/test-salao']}>
        <Routes>
          <Route path="/agendar/:slug" element={<PublicBooking />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Studio Azzo')).toBeInTheDocument();
    expect(screen.getByText('Resumo rapido')).toBeInTheDocument();
    expect(screen.getByText('Resumo do agendamento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Escolha os servicos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar servicos/i)).toBeInTheDocument();
    expect(screen.getByText(/2 servico/i)).toBeInTheDocument();
  });

  it('should improve service and availability feedback across the flow', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/agendar/test-salao']}>
        <Routes>
          <Route path="/agendar/:slug" element={<PublicBooking />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Corte')).toBeInTheDocument();

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(screen.getAllByText(/1 selecionado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Valor total/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(await screen.findByRole('heading', { name: /Escolha o Profissional/i })).toBeInTheDocument();

    await user.click(screen.getByText('Ana Souza'));
    await user.click(screen.getByRole('button', { name: /Continuar/i }));

    expect(await screen.findByRole('heading', { name: /Escolha data e horario/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2 horario\(s\) encontrado\(s\) para esta data/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '09:00' }));

    expect(screen.getAllByText('09:00').length).toBeGreaterThan(0);
    expect(screen.getByText(/Data escolhida:/i)).toBeInTheDocument();
  });
});
