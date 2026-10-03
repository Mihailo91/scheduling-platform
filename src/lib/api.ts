import "server-only";

import { auth } from "@/auth";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function unauthorized(): Response {
  return json({ error: "Unauthorized" }, 401);
}

export function forbidden(): Response {
  return json({ error: "Forbidden" }, 403);
}

export function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400);
}

export async function getSession() {
  return auth();
}
