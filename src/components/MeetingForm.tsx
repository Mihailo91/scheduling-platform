"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ParticipantPicker } from "@/components/ParticipantPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16);
}

type MeetingFormProps = {
  mode: "create" | "edit";
  meetingId?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    participantIds?: string[];
  };
  onSuccess?: (meetingId: string) => void;
};

export function MeetingForm({ mode, meetingId, defaultValues, onSuccess }: MeetingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [startTime, setStartTime] = useState(toDatetimeLocal(defaultValues?.startTime));
  const [endTime, setEndTime] = useState(toDatetimeLocal(defaultValues?.endTime));
  const [participantIds, setParticipantIds] = useState<string[]>(defaultValues?.participantIds ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = {
      title,
      description,
      location,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      participantIds,
    };

    try {
      const url = mode === "create" ? "/api/meetings" : `/api/meetings/${meetingId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Something went wrong");
        return;
      }

      const { meeting } = await res.json() as { meeting: { id: string } };
      onSuccess?.(meeting.id);
      router.push("/meetings/" + meeting.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New meeting" : "Edit meeting"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Candidate interview"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add context, agenda, and follow-up notes."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Room Atlas"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Participants</Label>
            <ParticipantPicker value={participantIds} onChange={setParticipantIds} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Start time</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End time</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : mode === "create" ? "Create meeting" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
