import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutDashboard, PlusCircle, Shield } from "lucide-react";

export const appNavigation: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  kind: "all" | "editor" | "admin";
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    kind: "all",
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: CalendarDays,
    kind: "all",
  },
  {
    href: "/meetings/new",
    label: "Create meeting",
    icon: PlusCircle,
    kind: "editor",
  },
  {
    href: "/admin/users",
    label: "Admin users",
    icon: Shield,
    kind: "admin",
  },
];
