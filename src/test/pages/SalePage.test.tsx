import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SalePage from '@/pages/SalePage';

const mocks = vi.hoisted(() => ({
  register: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useCheckoutProducts', () => ({
  useCheckoutProducts: () => ({
    products: [{ id: 'plan-basic', price: 99, currency: 'BRL' }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mocks.register,
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    publicLegalApi: {
      getAll: vi.fn().mockResolvedValue({
        termsOfUse: { version: '2026.04' },
        privacyPolicy: { version: '2026.04' },
      }),
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('SalePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('should render the updated hero with stronger CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/compras']}>
        <SalePage />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByRole('heading', {
        name: /Pare de perder agendamentos e organize seu salao em um unico sistema/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar conta gratis agora/i })).toBeInTheDocument();
    expect(screen.getByText(/Primeira etapa em 2 passos/i)).toBeInTheDocument();
  });

  it('should use a two-step commercial signup flow', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/compras']}>
        <SalePage />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Passo 1 de 2/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome do salao/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome completo/i), 'Phelipp Nascimento');
    await user.type(screen.getByLabelText(/^E-mail$/i), 'phelipp@example.com');
    await user.type(screen.getByLabelText(/^Senha$/i), 'Senha@123');
    await user.type(screen.getByLabelText(/Confirmar senha/i), 'Senha@123');
    await user.click(screen.getByRole('checkbox', { name: /Li e aceito os/i }));
    await user.click(screen.getByRole('button', { name: /Continuar para dados do salao/i }));

    expect(await screen.findByText(/Passo 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do salao/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone \/ WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF\/CNPJ/i)).toBeInTheDocument();
  });
});
