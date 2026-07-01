import type { LucideIcon } from "lucide-react";

export type SidebarMenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

export type SidebarMenuNode = {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  children: SidebarMenuNode[];
};
