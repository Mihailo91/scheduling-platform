"use client";

import { useState } from "react";

import { InviteStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";

type RsvpButtonsProps = {
  meetingId: string;
  currentStatus: InviteStatus;
  disabled?: boolean;
};

export function RsvpButtons({ meetingId, currentStatus, disabled }: RsvpButtonsProps) {
  const [status, setStatus] = useState<InviteStatus>(currentStatus);
  const [loading, setLoading] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRsvp(newStatus: "accepted" | "declined") {
    setLoading(newStatus);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Something went wrong");
      } else {
        setStatus(newStatus === "accepted" ? InviteStatus.accepted : InviteStatus.declined);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant={status === InviteStatus.accepted ? "default" : "outline"}
          disabled={disabled || loading !== null}
          onClick={() => handleRsvp("accepted")}
        >
          {loading === "accepted" ? "Saving…" : "Accept"}
        </Button>
        <Button
          variant={status === InviteStatus.declined ? "destructive" : "outline"}
          disabled={disabled || loading !== null}
          onClick={() => handleRsvp("declined")}
        >
          {loading === "declined" ? "Saving…" : "Decline"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
