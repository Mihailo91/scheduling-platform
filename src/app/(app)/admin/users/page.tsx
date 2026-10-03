import { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const roleBadgeVariant: Record<Role, "default" | "secondary" | "outline"> = {
  [Role.admin]: "default",
  [Role.hr]: "secondary",
  [Role.employee]: "outline",
};

export default async function AdminUsersPage() {
  await requireRole([Role.admin]);

  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.department && (
                <p className="text-sm text-muted-foreground">{user.department}</p>
              )}
            </div>
            <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
