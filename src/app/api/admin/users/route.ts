import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { forbidden, json, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  if (session.user.role !== Role.admin) return forbidden();

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return json({ users });
}
