import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsAccountTabProps {
  userName: string;
  userEmail: string;
  userRole?: string;
}

export function SettingsAccountTab({ userName, userEmail, userRole }: SettingsAccountTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conta</CardTitle>
        <CardDescription>
          Os dados do usuario, foto de perfil, senha e MFA agora ficam centralizados em uma pagina propria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              {userName || "Usuario"}
            </div>
            <div className="text-muted-foreground">{userEmail || "-"}</div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {userRole || "USER"}
            </div>
          </div>
        </div>

        <Button asChild className="gap-2">
          <Link to="/perfil-usuario">
            Abrir Perfil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
