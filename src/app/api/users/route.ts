import { db } from "@/lib/db";
import { canAccessAdmin, canCreateMeeting } from "@/lib/auth";
import { forbidden, json, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { role } = session.user;

  if (!canCreateMeeting(role) && !canAccessAdmin(role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const users = await db.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, department: true },
    orderBy: { name: "asc" },
  });

  return json({ users });
}
