import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTourStore } from "./tour-store";

export interface TutorialLauncherOption {
  id: string;
  label: string;
}

interface TutorialLauncherButtonProps {
  /** Texto do botão. Padrão: "Tutorial". */
  label?: string;
  /** Tour completo, oferecido no topo do menu. */
  fullTour: TutorialLauncherOption;
  /** Módulos individuais, oferecidos abaixo de uma separação. */
  modules: TutorialLauncherOption[];
  className?: string;
}

/**
 * Botão reutilizável para (re)iniciar um tutorial guiado a qualquer momento.
 * Oferece o tour completo e, quando o fluxo é dividido em módulos, cada um
 * deles isoladamente. Qualquer página pode usar este componente — basta
 * registrar seus tours em `components/tutorial/registry.ts` e passar aqui os
 * ids + rótulos.
 */
export function TutorialLauncherButton({
  label = "Tutorial",
  fullTour,
  modules,
  className,
}: TutorialLauncherButtonProps) {
  const startTour = useTourStore((state) => state.startTour);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className ?? "h-8 gap-1.5 text-xs sm:h-9 sm:text-sm"}
          data-tour-launcher
        >
          <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => startTour(fullTour.id)}>
          {fullTour.label}
        </DropdownMenuItem>
        {modules.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Ou escolha um módulo
            </DropdownMenuLabel>
            {modules.map((moduleOption) => (
              <DropdownMenuItem
                key={moduleOption.id}
                onClick={() => startTour(moduleOption.id)}
              >
                {moduleOption.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
