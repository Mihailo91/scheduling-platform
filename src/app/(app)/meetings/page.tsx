import Link from "next/link";

import { MeetingStatus, Role } from "@prisma/client";

import { MeetingCard } from "@/components/MeetingCard";
import { canCreateMeeting, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function formatMeetingTime(startTime: Date, endTime: Date) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startLabel = start.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  const endLabel = end.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { startLabel, endLabel };
}

const STATUS_TABS: { label: string; value?: MeetingStatus }[] = [
  { label: "All" },
  { label: "Scheduled", value: MeetingStatus.scheduled },
  { label: "Cancelled", value: MeetingStatus.cancelled },
  { label: "Completed", value: MeetingStatus.completed },
];

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAuth();
  const { status: statusFilter } = await searchParams;

  const { id: userId, role } = session.user;

  const validStatus =
    statusFilter && Object.values(MeetingStatus).includes(statusFilter as MeetingStatus)
      ? (statusFilter as MeetingStatus)
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (validStatus) where.status = validStatus;

  if (role !== Role.admin && role !== Role.hr) {
    where.OR = [{ organizerId: userId }, { participants: { some: { userId } } }];
  }

  const meetings = await db.meeting.findMany({
    where,
    include: {
      organizer: { select: { id: true, name: true } },
      participants: { select: { id: true, status: true, user: { select: { id: true, name: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Meetings</h2>
        </div>
        {canCreateMeeting(role) && (
          <Link
            href="/meetings/new"
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 h-8 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            New meeting
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS_TABS.map(({ label, value }) => {
          const href = value ? `/meetings?status=${value}` : "/meetings";
          const isActive = value === validStatus || (!value && !validStatus);
          return (
            <a
              key={label}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 transition-colors hover:bg-muted",
                isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </a>
          );
        })}
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No meetings found.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {meetings.map((meeting) => {
            const { startLabel, endLabel } = formatMeetingTime(meeting.startTime, meeting.endTime);
            return (
              <MeetingCard
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                title={meeting.title}
                description={meeting.description ?? ""}
                location={meeting.location ?? ""}
                startLabel={startLabel}
                endLabel={endLabel}
                status={meeting.status}
                participantsLabel={`${meeting.participants.length} participant${meeting.participants.length !== 1 ? "s" : ""}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
