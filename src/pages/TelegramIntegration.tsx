import { MainLayout } from "@/components/layout/MainLayout";
import { TelegramIntegrationCard } from "@/components/settings/TelegramIntegrationCard";

export default function TelegramIntegration() {
  return (
    <MainLayout title="Integracoes" subtitle="Configure o bot do Telegram do seu tenant">
      <div className="w-full">
        <TelegramIntegrationCard />
      </div>
    </MainLayout>
  );
}
