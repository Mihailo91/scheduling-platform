import { MeetingStatus, Role } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { canManageMeeting } from "@/lib/auth";
import { badRequest, forbidden, json, notFound, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/api";

const updateMeetingSchema = z.object({
  title: z.string().min(1, { error: "Required" }).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  participantIds: z.array(z.string()).optional(),
});

const participantSelect = {
  id: true,
  status: true,
  user: { select: { id: true, name: true, email: true } },
};

const organizerSelect = { id: true, name: true, email: true };

async function getMeeting(id: string) {
  return db.meeting.findUnique({
    where: { id },
    include: {
      organizer: { select: organizerSelect },
      participants: { select: participantSelect },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) return notFound();

  const { id: userId, role } = session.user;

  if (role !== Role.admin && role !== Role.hr) {
    const isOrganizer = meeting.organizerId === userId;
    const isParticipant = meeting.participants.some((p) => p.user.id === userId);
    if (!isOrganizer && !isParticipant) return notFound();
  }

  return json({ meeting });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) return notFound();

  if (!canManageMeeting(session.user, meeting.organizerId)) return forbidden();

  if (meeting.status === MeetingStatus.cancelled) {
    return badRequest("Cannot update a cancelled meeting");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = updateMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { title, description, location, startTime, endTime } = parsed.data;

  const resolvedStart = startTime
    ? new Date(startTime)
    : meeting.startTime;
  const resolvedEnd = endTime ? new Date(endTime) : meeting.endTime;

  if (resolvedEnd <= resolvedStart) {
    return badRequest("endTime must be after startTime");
  }

  const updated = await db.meeting.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(startTime !== undefined && { startTime: new Date(startTime) }),
      ...(endTime !== undefined && { endTime: new Date(endTime) }),
    },
    include: {
      organizer: { select: organizerSelect },
      participants: { select: participantSelect },
    },
  });

  return json({ meeting: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) return notFound();

  if (!canManageMeeting(session.user, meeting.organizerId)) return forbidden();

  const updated = await db.meeting.update({
    where: { id },
    data: { status: MeetingStatus.cancelled },
    include: {
      organizer: { select: organizerSelect },
      participants: { select: participantSelect },
    },
  });

  return json({ meeting: updated });
}
