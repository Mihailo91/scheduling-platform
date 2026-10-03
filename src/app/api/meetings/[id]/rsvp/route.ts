import { InviteStatus, MeetingStatus } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { badRequest, forbidden, json, notFound, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/api";

const rsvpSchema = z.object({
  status: z.enum([InviteStatus.accepted, InviteStatus.declined]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const userId = session.user.id;

  const meeting = await db.meeting.findUnique({ where: { id } });
  if (!meeting) return notFound();

  if (
    meeting.status === MeetingStatus.cancelled ||
    meeting.status === MeetingStatus.completed
  ) {
    return badRequest("Cannot RSVP to a cancelled or completed meeting");
  }

  const participant = await db.meetingParticipant.findUnique({
    where: { meetingId_userId: { meetingId: id, userId } },
  });

  if (!participant) {
    return forbidden();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const updated = await db.meetingParticipant.update({
    where: { meetingId_userId: { meetingId: id, userId } },
    data: { status: parsed.data.status },
  });

  return json({ participant: updated });
}
