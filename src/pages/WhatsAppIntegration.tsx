import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { WhatsAppIntegrationCard } from "@/components/settings/WhatsAppIntegrationCard";
import { TutorialLauncherButton } from "@/components/tutorial/TutorialLauncherButton";
import { useTourStore } from "@/components/tutorial/tour-store";
import { WHATSAPP_INTEGRATION_TOUR_ID } from "@/components/settings/tutorial/whatsapp-integration-tour";

export default function WhatsAppIntegration() {
  const startTourIfNeverSeen = useTourStore((state) => state.startTourIfNeverSeen);

  // Tutorial guiado da integracao: inicia automaticamente apenas no
  // PRIMEIRO acesso a pagina (persistido por tour+versao). O pequeno
  // atraso deixa o card montar antes do primeiro destaque.
  useEffect(() => {
    const timer = window.setTimeout(() => startTourIfNeverSeen(WHATSAPP_INTEGRATION_TOUR_ID), 600);
    return () => window.clearTimeout(timer);
  }, [startTourIfNeverSeen]);

  return (
    <MainLayout title="Integracoes" subtitle="Configure o WhatsApp Cloud API do seu tenant">
      <div className="w-full space-y-4">
        <div className="flex justify-end">
          <TutorialLauncherButton
            fullTour={{ id: WHATSAPP_INTEGRATION_TOUR_ID, label: "Tour completo da integracao" }}
            modules={[]}
          />
        </div>
        <WhatsAppIntegrationCard />
      </div>
    </MainLayout>
  );
}
