import Link from "next/link";
import type { Role } from "@prisma/client";
import { CalendarDays, LayoutDashboard, Shield, UserRoundCog } from "lucide-react";

import { appNavigation } from "@/lib/navigation";
import { canAccessAdmin, canCreateMeeting } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role: Role;
  };
};

export function Sidebar({ user }: SidebarProps) {
  const visibleNavigation = appNavigation.filter((item) => {
    if (item.kind === "admin") {
      return canAccessAdmin(user.role);
    }

    if (item.kind === "editor") {
      return canCreateMeeting(user.role);
    }

    return true;
  });

  return (
    <aside className="border-r bg-background px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="rounded-xl bg-primary p-2 text-primary-foreground">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Scheduling Platform</p>
          <p className="text-xs text-muted-foreground">HR operations</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {visibleNavigation.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-9 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              "w-full justify-start gap-3"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-xl border bg-muted/50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserRoundCog className="size-4" />
          Signed in as
        </div>
        <p className="mt-2 font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Access is granted according to your role. Admin users can manage all
          routes, HR can create meetings, and employees have read-only access.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <LayoutDashboard className="size-3.5" />
          Dashboard access
          <Shield className="ml-2 size-3.5" />
          {user.role}
        </div>
      </div>
    </aside>
  );
}
