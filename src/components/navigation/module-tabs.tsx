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
};

export function ModuleTabs({ items, pathname }: ModuleTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const customIsActive =
          typeof item.isActive === "function" ? item.isActive(pathname) : item.isActive;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center rounded-md border px-3 py-2 text-sm transition-colors",
                (customIsActive ?? isActive)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )
            }
          >
            {item.label}
          </NavLink>
        );
      })}
    </div>
  );
}
