import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AbandonmentReport from "@/pages/report/AbandonmentReport";

vi.mock("@/components/chat/ChatInboxNotifier", () => ({
  ChatInboxNotifier: () => null,
}));

vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({
    children,
    title,
    subtitle,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("@/components/dashboard/WhatsAppReactivationQueue", () => ({
  WhatsAppReactivationQueue: () => <div>WhatsAppReactivationQueueMock</div>,
}));

describe("AbandonmentReport", () => {
  it("should render the dedicated abandonment report page", () => {
    render(
      <MemoryRouter>
        <AbandonmentReport />
      </MemoryRouter>
    );

    expect(screen.getByText("Relatorio de abandono")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fila operacional para acompanhar conversas pausadas, excecoes e retomadas do WhatsApp."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Uso operacional")).toBeInTheDocument();
    expect(screen.getByText("WhatsAppReactivationQueueMock")).toBeInTheDocument();
  });
});
