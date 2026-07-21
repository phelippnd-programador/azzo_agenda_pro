import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export type ModuleTabItem = {
  to: string;
  label: string;
  isActive?: boolean | ((pathname: string) => boolean);
};

type ModuleTabsProps = {
  items: ModuleTabItem[];
  pathname: string;
  "data-tour"?: string;
};

export function ModuleTabs({ items, pathname, ...rest }: ModuleTabsProps) {
  return (
    <div
      data-tour={rest["data-tour"]}
      className="overflow-x-auto rounded-xl border border-border/70 bg-card/70 p-1.5 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.22)]"
    >
      <div className="flex min-w-max gap-1.5">
      {items.map((item) => {
        const customIsActive =
          typeof item.isActive === "function" ? item.isActive(pathname) : item.isActive;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "inline-flex shrink-0 items-center rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                (customIsActive ?? isActive)
                  ? "border-primary/30 bg-primary/12 text-primary shadow-sm"
                  : "border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/45 hover:text-foreground"
              )
            }
          >
            {item.label}
          </NavLink>
        );
      })}
      </div>
    </div>
  );
}
