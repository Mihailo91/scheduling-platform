# Copilot Instructions

## ⚠️ This is NOT the Next.js you know

Next.js 16, Prisma 7, NextAuth v5, and Zod v4 all have **breaking changes** from their most-trained versions. Read `node_modules/next/dist/docs/` before writing any Next.js code.

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint (eslint-config-next, core-web-vitals + typescript)
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:migrate   # run pending migrations (dev)
npm run db:seed      # seed DB with 8 users + 3 meetings
npm run db:studio    # open Prisma Studio
```

No test suite exists yet. TypeScript is checked with:
```bash
npx tsc --noEmit
```

**Local Postgres** (Docker not available — use Podman):
```bash
podman run -d --name scheduling-db \
  -e POSTGRES_DB=hr_scheduler -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 docker.io/library/postgres:16-alpine
```
Port 5432 is often occupied; use 5433 and set `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hr_scheduler`.

---

## Architecture

```
src/
  app/
    (auth)/login/          # Public login route + server action
    (app)/                 # Protected shell — requireAuth() in layout
      dashboard/
      meetings/            # List, new, [id], [id]/edit
      admin/users/
    api/
      auth/[...nextauth]/  # NextAuth handlers
      meetings/            # GET+POST, [id] GET+PATCH+DELETE, [id]/rsvp POST
      users/               # Participant picker (admin/hr only)
      admin/users/         # Admin-only full user list
  auth.ts                  # NextAuth config (single source of truth)
  lib/
    auth.ts     # Server-only helpers: requireAuth, requireRole, canManageMeeting, etc.
    api.ts      # Route handler helpers: json(), unauthorized(), forbidden(), etc.
    db.ts       # Prisma singleton
  components/
    ui/         # shadcn/ui primitives (Button, Badge, Card, Input, Label, Select, Textarea)
    Sidebar.tsx, LoginForm.tsx, MeetingCard.tsx, MeetingForm.tsx, ...
  types/
    next-auth.d.ts  # Augments Session.user with id, role, department
prisma/
  schema.prisma   # Models: User, Meeting, MeetingParticipant
  seed.ts
prisma.config.ts  # Prisma 7 config — datasource URL lives here, NOT in schema.prisma
proxy.ts          # Route guard (Next.js 16 renamed middleware.ts → proxy.ts)
```

**Auth flow**: `proxy.ts` (exported as `proxy`, not `middleware`) uses NextAuth's `authorized` callback to guard all non-static routes. Protected pages additionally call `requireAuth()` or `requireRole()` from `src/lib/auth.ts`. Route handlers call `getSession()` from `src/lib/api.ts` and return JSON errors (never redirect).

**Role model**:
- `admin` — full access, manage all meetings and users
- `hr` — create/manage own meetings, view all meetings
- `employee` — view only meetings they organized or were invited to, RSVP

---

## Breaking Changes & Key Conventions

### Next.js 16

- **`middleware.ts` → `proxy.ts`**. Export `proxy` (not `middleware`). The `authorized` callback lives in the NextAuth config (`src/auth.ts`), not in `proxy.ts` itself.
- **Dynamic segment params are a `Promise`** — must be awaited in route handlers and pages:
  ```ts
  export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- Route handlers are not cached by default. Use `export const dynamic = 'force-static'` only for truly static GET handlers.

### Prisma 7

- **`url` removed from `datasource db {}` in `schema.prisma`** — connection URL is in `prisma.config.ts` under `datasource.url: env("DATABASE_URL")`.
- **`PrismaClient` requires a driver adapter** — no connection string in constructor:
  ```ts
  import { PrismaPg } from "@prisma/adapter-pg";
  import { Pool } from "pg";
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  ```
  This pattern is used in both `src/lib/db.ts` and `prisma/seed.ts`.
- `migrations.seed` path is in `prisma.config.ts`, not in the `"prisma"` key of `package.json`.
- `prisma.config.ts` must `import "dotenv/config"` at the top.

### NextAuth v5 (beta)

- `AUTH_TRUST_HOST=true` env var is **required** at runtime for non-Vercel deployments (in addition to `trustHost: true` in config).
- Route handler export pattern:
  ```ts
  import { handlers } from "@/auth";
  export const GET = handlers.GET;
  export const POST = handlers.POST;
  ```
- `signIn("credentials", {...})` always throws on redirect — rethrow non-`AuthError` exceptions.
- Augment `Session.user` in `src/types/next-auth.d.ts` (see that file for the pattern).

### Zod v4

- Validation error messages use `{ error: "..." }`, **not** `{ message: "..." }`:
  ```ts
  z.string().min(1, { error: "Required" })
  z.string().email({ error: "Invalid email" })
  ```
- Access errors via `.issues` (not `.errors`): `parsed.error.issues[0]?.message`.

### shadcn/ui

- Style: `base-nova`, base color `neutral`, Tailwind v4, primitives from `@base-ui/react` (not Radix UI).
- `buttonVariants()` is a client-side function — **cannot be called in Server Components**. Use raw Tailwind classes instead.
- Add new components with `npx shadcn add <component>`.

### Server / Client boundary

- Files in `src/lib/` that are server-only use `import "server-only"` at the top.
- Route handler files (`route.ts`) must **not** have `import "server-only"`.
- `src/app/(app)/layout.tsx` is a Server Component — it calls `requireAuth()` and passes session data as props to client components.
- When a component needs `buttonVariants` or other client functions, make it a Client Component (`"use client"`) or pass pre-computed values from the server.

### Environment variables

Required in `.env` (see `.env.example`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hr_scheduler
NEXTAUTH_SECRET=<random string>
AUTH_TRUST_HOST=true
```
