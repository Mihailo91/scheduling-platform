import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoAccounts = [
  {
    label: "Admin",
    email: "admin@company.com",
    role: Role.admin,
  },
  {
    label: "HR",
    email: "hr1@company.com",
    role: Role.hr,
  },
  {
    label: "Employee",
    email: "employee1@company.com",
    role: Role.employee,
  },
];

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <LoginForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seeded accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoAccounts.map((account) => (
            <div
              key={account.email}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{account.label}</p>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
              <Badge variant="secondary">{account.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
