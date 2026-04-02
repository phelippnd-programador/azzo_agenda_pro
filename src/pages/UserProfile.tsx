import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfileContent } from "@/components/users/UserProfileContent";

export default function UserProfile() {
  return (
    <MainLayout title="Perfil" subtitle="Gerencie seus dados pessoais, foto e seguranca da conta">
      <UserProfileContent />
    </MainLayout>
  );
}
