import { CalendarCheck2, Clock3, Users } from "lucide-react";

import { InviteStatus, MeetingStatus, Role } from "@prisma/client";

import { MeetingCard } from "@/components/MeetingCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

function formatMeetingTime(startTime: Date, endTime: Date) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startLabel = start.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  const endLabel = end.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { startLabel, endLabel };
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const { id: userId, role } = session.user;
  const now = new Date();

  const [upcomingCount, pendingRsvpCount, thirdStatCount, upcomingMeetings] =
    await Promise.all([
      db.meeting.count({
        where: { status: MeetingStatus.scheduled, startTime: { gt: now } },
      }),
      db.meetingParticipant.count({
        where: {
          status: InviteStatus.pending,
          meeting: { status: MeetingStatus.scheduled },
        },
      }),
      role === Role.admin || role === Role.hr
        ? db.user.count()
        : db.meeting.count({
            where: {
              OR: [{ organizerId: userId }, { participants: { some: { userId } } }],
            },
          }),
      db.meeting.findMany({
        where: { status: MeetingStatus.scheduled, startTime: { gt: now } },
        include: {
          organizer: { select: { id: true, name: true } },
          participants: { select: { id: true, status: true, user: { select: { id: true, name: true } } } },
        },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
    ]);

  const thirdStatLabel = role === Role.admin || role === Role.hr ? "Total employees" : "My meetings";

  const statCards = [
    { label: "Upcoming meetings", value: upcomingCount, icon: CalendarCheck2 },
    { label: "Pending RSVPs", value: pendingRsvpCount, icon: Clock3 },
    { label: thirdStatLabel, value: thirdStatCount, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="mt-1 text-3xl">{value}</CardTitle>
              </div>
              <div className="rounded-full bg-muted p-2 text-muted-foreground">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Upcoming meetings</h3>
        {upcomingMeetings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No upcoming meetings.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {upcomingMeetings.map((meeting) => {
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
      </section>
    </div>
  );
}
