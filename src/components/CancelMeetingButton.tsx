"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type CancelMeetingButtonProps = {
  meetingId: string;
  onCancelled?: () => void;
};

export function CancelMeetingButton({ meetingId, onCancelled }: CancelMeetingButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Something went wrong");
        setConfirming(false);
      } else {
        onCancelled?.();
        router.push("/meetings");
      }
    } catch {
      setError("Network error");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button variant="destructive" disabled={loading} onClick={handleClick}>
        {loading ? "Cancelling…" : confirming ? "Are you sure? Click again to confirm." : "Cancel meeting"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
