import { NavLink } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const activeItem = items.find((item) => {
    const customIsActive =
      typeof item.isActive === "function" ? item.isActive(pathname) : item.isActive;
    return customIsActive ?? pathname === item.to;
  });

  return (
    <Tabs value={activeItem?.to ?? pathname} className="max-w-full overflow-x-auto">
      <TabsList data-tour={rest["data-tour"]} className="min-w-max justify-start">
        {items.map((item) => {
          return (
            <TabsTrigger key={item.to} value={item.to} asChild>
              <NavLink to={item.to}>{item.label}</NavLink>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
