import { MeetingStatus, Role } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { canCreateMeeting } from "@/lib/auth";
import { badRequest, forbidden, json, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/api";

const createMeetingSchema = z.object({
  title: z.string().min(1, { error: "Required" }),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  participantIds: z.array(z.string()).optional().default([]),
});

const participantSelect = {
  id: true,
  status: true,
  user: { select: { id: true, name: true, email: true } },
};

const organizerSelect = { id: true, name: true, email: true };

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as MeetingStatus | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (status && Object.values(MeetingStatus).includes(status)) {
    where.status = status;
  }
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  }

  const { id: userId, role } = session.user;

  if (role !== Role.admin && role !== Role.hr) {
    where.OR = [
      { organizerId: userId },
      { participants: { some: { userId } } },
    ];
  }

  const meetings = await db.meeting.findMany({
    where,
    include: {
      organizer: { select: organizerSelect },
      participants: { select: participantSelect },
    },
    orderBy: { startTime: "asc" },
  });

  return json({ meetings });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { id: userId, role } = session.user;

  if (!canCreateMeeting(role)) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = createMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { title, description, location, startTime, endTime, participantIds } =
    parsed.data;

  if (new Date(endTime) <= new Date(startTime)) {
    return badRequest("endTime must be after startTime");
  }

  const uniqueParticipantIds = [
    ...new Set(participantIds.filter((id) => id !== userId)),
  ];

  const meeting = await db.meeting.create({
    data: {
      title,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      organizerId: userId,
      participants: {
        create: uniqueParticipantIds.map((pid) => ({ userId: pid })),
      },
    },
    include: {
      organizer: { select: organizerSelect },
      participants: { select: participantSelect },
    },
  });

  return json({ meeting }, 201);
}
