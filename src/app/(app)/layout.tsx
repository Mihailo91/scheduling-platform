import { Bell, Search } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";
import { Input } from "@/components/ui/input";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[260px_1fr]">
        <Sidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-background/90 px-6 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Internal HR workspace
                </p>
                <h1 className="text-xl font-semibold tracking-tight">
                  Scheduling Platform
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search placeholder"
                    placeholder="Search meetings and people"
                    className="pl-9"
                  />
                </div>
                <div className="rounded-full border bg-background p-2 text-muted-foreground">
                  <Bell className="size-4" />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {session.user.role}
                  </p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
