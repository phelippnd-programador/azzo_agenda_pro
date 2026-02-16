import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unauthorized() {
  return (
    <MainLayout
      title="Acesso não autorizado"
      subtitle="Você não tem permissão para acessar essa rota."
    >
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Permissão insuficiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O menu foi ocultado e o acesso direto por URL também foi bloqueado.
            </p>
            <Button asChild>
              <Link to="/">Voltar ao dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
