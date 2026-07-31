import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { appRouteManifest } from "@/app/route-manifest";

type StepDoneProps = {
  professionalsCount: number;
  servicesCount: number;
  onComplete: () => void;
  isCompleting: boolean;
};

export function StepDone({ professionalsCount, servicesCount, onComplete, isCompleting }: StepDoneProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Tudo pronto!</h2>
        <p className="text-muted-foreground max-w-sm">
          Sua agenda está configurada e pronta para o primeiro agendamento.
        </p>
      </div>

      <div className="flex gap-6 rounded-xl border border-border/70 bg-muted/30 px-8 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{professionalsCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {professionalsCount === 1 ? "profissional" : "profissionais"}
          </p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{servicesCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {servicesCount === 1 ? "serviço" : "serviços"}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Button className="w-full" size="lg" onClick={onComplete} disabled={isCompleting}>
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Ver minha agenda
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={appRouteManifest.shell.dashboard}>Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}
