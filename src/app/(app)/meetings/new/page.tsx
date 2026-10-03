import { Role } from "@prisma/client";

import { MeetingForm } from "@/components/MeetingForm";
import { requireRole } from "@/lib/auth";

export default async function NewMeetingPage() {
  await requireRole([Role.admin, Role.hr]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">New meeting</h2>
      <MeetingForm mode="create" />
    </div>
  );
}
