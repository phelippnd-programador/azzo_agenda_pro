import type { LucideIcon } from "lucide-react";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CrudListToolbarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
  gridAriaLabel?: string;
  tableAriaLabel?: string;
  actionLabel: string;
  onAction: () => void;
  actionIcon?: LucideIcon;
  actionLabelMobile?: string;
  actionLabelDesktop?: string;
  actionDisabled?: boolean;
  actionDisabledReason?: string;
  searchMaxWidthClassName?: string;
};

export function CrudListToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  viewMode,
  onViewModeChange,
  gridAriaLabel = "Visualizar em cards",
  tableAriaLabel = "Visualizar em lista",
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  actionLabelMobile,
  actionLabelDesktop,
  actionDisabled = false,
  actionDisabledReason,
  searchMaxWidthClassName = "max-w-md",
}: CrudListToolbarProps) {
  const mobileActionLabel = actionLabelMobile || actionLabel;
  const desktopActionLabel =
    actionLabelDesktop || (actionLabelMobile ? `${actionLabelMobile} ${actionLabel}` : actionLabel);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/75 p-3 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.18)] sm:gap-4 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className={`relative w-full flex-1 ${searchMaxWidthClassName}`}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 border-border/70 bg-background/85 pl-9"
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
          {viewMode && onViewModeChange ? (
            <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border/70 bg-background/85">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("grid")}
                className="h-9 w-9 rounded-none"
                aria-label={gridAriaLabel}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("table")}
                className="h-9 w-9 rounded-none"
                aria-label={tableAriaLabel}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          <Button
            className="h-10 w-full gap-2 sm:w-auto"
            onClick={onAction}
            disabled={actionDisabled}
            aria-label={desktopActionLabel}
            title={actionDisabled ? actionDisabledReason : undefined}
          >
            <ActionIcon className="h-4 w-4" />
            <span className="sm:hidden">{mobileActionLabel}</span>
            <span className="hidden sm:inline">{desktopActionLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
