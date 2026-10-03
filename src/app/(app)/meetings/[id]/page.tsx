import Link from "next/link";
import { notFound } from "next/navigation";

import { InviteStatus, MeetingStatus, Role } from "@prisma/client";

import { CancelMeetingButton } from "@/components/CancelMeetingButton";
import { RsvpButtons } from "@/components/RsvpButtons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canManageMeeting, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

const inviteStatusVariant: Record<InviteStatus, "outline" | "secondary" | "destructive"> = {
  [InviteStatus.pending]: "outline",
  [InviteStatus.accepted]: "secondary",
  [InviteStatus.declined]: "destructive",
};

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const meeting = await db.meeting.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      participants: { select: { id: true, status: true, user: { select: { id: true, name: true } } } },
    },
  });

  if (!meeting) notFound();

  const { id: userId, role } = session.user;

  if (role !== Role.admin && role !== Role.hr) {
    const isOrganizer = meeting.organizerId === userId;
    const isParticipant = meeting.participants.some((p) => p.user.id === userId);
    if (!isOrganizer && !isParticipant) notFound();
  }

  const myParticipant = meeting.participants.find((p) => p.user.id === userId);

  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const startStr = start.toLocaleString("en-GB", dateOpts);
  const endStr = end.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const canManage = canManageMeeting(session.user, meeting.organizerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{meeting.title}</h2>
          <p className="text-muted-foreground">Organised by {meeting.organizer.name}</p>
        </div>
        <Badge variant={meeting.status === MeetingStatus.scheduled ? "default" : meeting.status === MeetingStatus.completed ? "secondary" : "destructive"}>
          {meeting.status}
        </Badge>
      </div>

      {canManage && meeting.status !== MeetingStatus.cancelled && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/meetings/${id}/edit`}
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
          >
            Edit
          </Link>
          <CancelMeetingButton meetingId={id} />
        </div>
      )}

      {myParticipant && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Your RSVP</p>
          <RsvpButtons
            meetingId={id}
            currentStatus={myParticipant.status}
            disabled={meeting.status !== MeetingStatus.scheduled}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Meeting details</CardTitle>
            <CardDescription>Organised by {meeting.organizer.name}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium">Time</p>
              <p className="text-muted-foreground">{startStr} – {endStr}</p>
            </div>
            {meeting.location && (
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{meeting.location}</p>
              </div>
            )}
            {meeting.description && (
              <div className="sm:col-span-2">
                <p className="font-medium">Description</p>
                <p className="text-muted-foreground">{meeting.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>{meeting.participants.length} invited</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {meeting.participants.length === 0 ? (
              <p className="text-muted-foreground">No participants.</p>
            ) : (
              meeting.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>{p.user.name}</span>
                  <Badge variant={inviteStatusVariant[p.status]}>{p.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
