import "server-only";

import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function getCurrentSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export function hasRole(
  role: Role | undefined,
  allowedRoles: readonly Role[],
): role is Role {
  return role !== undefined && allowedRoles.includes(role);
}

export function canAccessAdmin(role: Role | undefined) {
  return hasRole(role, [Role.admin]);
}

export function canCreateMeeting(role: Role | undefined) {
  return hasRole(role, [Role.admin, Role.hr]);
}

export function canManageMeeting(
  user: Pick<NonNullable<Session["user"]>, "id" | "role">,
  organizerId: string,
) {
  return user.role === Role.admin || (user.role === Role.hr && user.id === organizerId);
}
