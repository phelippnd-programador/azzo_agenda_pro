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
  searchMaxWidthClassName = "max-w-md",
}: CrudListToolbarProps) {
  const mobileActionLabel = actionLabelMobile || actionLabel;
  const desktopActionLabel =
    actionLabelDesktop || (actionLabelMobile ? `${actionLabelMobile} ${actionLabel}` : actionLabel);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className={`relative w-full flex-1 ${searchMaxWidthClassName}`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {viewMode && onViewModeChange ? (
          <div className="flex overflow-hidden rounded-lg border bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
              aria-label={gridAriaLabel}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("table")}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
              aria-label={tableAriaLabel}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Button
          className="gap-2"
          onClick={onAction}
          aria-label={desktopActionLabel}
        >
          <ActionIcon className="h-4 w-4" />
          <span className="sm:hidden">{mobileActionLabel}</span>
          <span className="hidden sm:inline">{desktopActionLabel}</span>
        </Button>
      </div>
    </div>
  );
}
