import { notFound, redirect } from "next/navigation";

import { MeetingForm } from "@/components/MeetingForm";
import { canManageMeeting, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EditMeetingPage({
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

  if (!canManageMeeting(session.user, meeting.organizerId)) {
    redirect(`/meetings/${id}`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Edit meeting</h2>
      <MeetingForm
        mode="edit"
        meetingId={id}
        defaultValues={{
          title: meeting.title,
          description: meeting.description ?? undefined,
          location: meeting.location ?? undefined,
          startTime: meeting.startTime.toISOString(),
          endTime: meeting.endTime.toISOString(),
          participantIds: meeting.participants.map((p) => p.user.id),
        }}
      />
    </div>
  );
}
