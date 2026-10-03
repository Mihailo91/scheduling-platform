---
name: meeting-organiser
description: Expert guide for working on the scheduling-platform meeting domain — creating, editing, cancelling, and RSVP-ing meetings. Use this skill when asked to add features, fix bugs, or reason about meetings, participants, RSVP flows, or role-based access in this codebase.
---

# Meeting Organiser Skill

## Data model

```prisma
enum Role          { admin hr employee }
enum MeetingStatus { scheduled cancelled completed }
enum InviteStatus  { pending accepted declined }

model Meeting {
  id          String               @id @default(cuid())
  title       String
  description String?
  location    String?
  startTime   DateTime
  endTime     DateTime
  status      MeetingStatus        @default(scheduled)
  organizerId String
  organizer   User                 @relation("MeetingOrganizer")
  participants MeetingParticipant[]
}

model MeetingParticipant {
  meetingId String
  userId    String
  status    InviteStatus @default(pending)
  @@unique([meetingId, userId])
}
```

## Role-based access rules

| Action | admin | hr | employee |
|---|---|---|---|
| View meeting | ✅ all | ✅ all | ✅ only if organizer or participant |
| Create meeting | ✅ | ✅ | ❌ |
| Edit meeting | ✅ | ✅ only own | ❌ |
| Cancel meeting | ✅ | ✅ only own | ❌ |
| RSVP | ✅ if participant | ✅ if participant | ✅ if participant |

Use `canManageMeeting(user, meeting.organizerId)` from `src/lib/auth.ts` for edit/cancel checks — never inline this logic.

## API routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/meetings` | List (role-filtered). Query: `status`, `from`, `to` |
| POST | `/api/meetings` | Create. Body: title, description?, location?, startTime, endTime, participantIds[] |
| GET | `/api/meetings/[id]` | Single meeting with organizer + participants |
| PATCH | `/api/meetings/[id]` | Update (all fields optional). Cannot update cancelled meetings |
| DELETE | `/api/meetings/[id]` | Soft-cancel: sets status → `cancelled` |
| POST | `/api/meetings/[id]/rsvp` | RSVP. Body: `{ status: "accepted" | "declined" }` |
| GET | `/api/users` | User search for participant picker (admin/hr only). Query: `search` |

## API route conventions

- Always use `getSession()` from `src/lib/api.ts` (not `requireAuth` which redirects)
- Return JSON errors with helpers: `unauthorized()`, `forbidden()`, `notFound()`, `badRequest(msg)`
- Dynamic params are a Promise in Next.js 16: `const { id } = await params`
- Do NOT `import "server-only"` in route files

## UI components

- `<MeetingForm mode="create|edit" meetingId? defaultValues? />` — client component, handles POST/PATCH
- `<MeetingCard href title description location startLabel endLabel status participantsLabel />` — server-renderable display card
- `<ParticipantPicker value onChange />` — client component, debounced search against `/api/users`
- `<RsvpButtons meetingId currentStatus disabled? />` — client component, calls `/api/meetings/[id]/rsvp`
- `<CancelMeetingButton meetingId onCancelled? />` — client component, two-click confirmation then DELETE

## Page patterns

Meeting pages are Server Components that:
1. Call `requireAuth()` or `requireRole(...)` at the top
2. Fetch directly from `db` (do not call own API routes from server components)
3. Pass mapped props to client components

Example role-filtered query for the meetings list:
```ts
const where = (role === Role.admin || role === Role.hr)
  ? {}
  : { OR: [{ organizerId: userId }, { participants: { some: { userId } } }] };

const meetings = await db.meeting.findMany({
  where,
  include: {
    organizer: { select: { id: true, name: true, email: true } },
    participants: { select: { id: true, status: true, user: { select: { id: true, name: true, email: true } } } },
  },
  orderBy: { startTime: "asc" },
});
```

## Validation (Zod v4)

- Error messages use `{ error: "..." }` not `{ message: "..." }`
- Access errors via `.issues[0]?.message` not `.errors`
- Always validate `endTime > startTime` before writing to DB
- Strip the organizer from `participantIds` before creating `MeetingParticipant` records

## Business rules

- A cancelled meeting cannot be updated (PATCH returns 400)
- Cancellation is a soft delete: `status = "cancelled"`, record is never hard-deleted
- Organizer is never added to `MeetingParticipant` — they have implicit access via `organizerId`
- RSVP is only allowed on `scheduled` meetings (not cancelled or completed)
- `participantIds` deduplication: `[...new Set(ids.filter(id => id !== organizerId))]`
