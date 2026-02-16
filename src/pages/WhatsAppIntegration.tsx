import { MainLayout } from "@/components/layout/MainLayout";
import { WhatsAppIntegrationCard } from "@/components/settings/WhatsAppIntegrationCard";

export default function WhatsAppIntegration() {
  return (
    <MainLayout
      title="Integrações"
      subtitle="Configure o WhatsApp Cloud API do seu tenant"
    >
      <div className="max-w-3xl">
        <WhatsAppIntegrationCard />
      </div>
    </MainLayout>
  );
}
