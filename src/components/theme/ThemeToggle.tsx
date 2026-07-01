import { LaptopMinimal, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: LaptopMinimal },
] as const;

type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

type ThemeToggleProps = {
  align?: "start" | "center" | "end";
  className?: string;
};

export function ThemeToggle({ align = "end", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const activeTheme = (theme ?? "system") as ThemeOption;
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Alterar tema"
        >
          <TriggerIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeTheme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              className="flex items-center justify-between"
              onClick={() => setTheme(option.value)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-70" />
                {option.label}
              </span>
              {isActive ? <span className="text-xs text-primary">Ativo</span> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
