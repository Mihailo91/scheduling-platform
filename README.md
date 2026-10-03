# Scheduling Platform

Internal HR meeting scheduling application built with Next.js App Router, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, and NextAuth.

## Current status

The repository foundation is in place:

- Next.js 16 app scaffolded with TypeScript and Tailwind CSS
- shadcn/ui initialized with base primitives
- route groups created for auth, app, meetings, and admin sections
- Docker Compose and environment template added for local Postgres
- core dependencies installed for Prisma, PostgreSQL, bcrypt, and auth work

Authentication, database models, and API handlers are the next implementation steps.

## Tech stack

- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- NextAuth

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

   If you prefer Podman and don't have a compose provider installed, you can run:

   ```bash
   podman run -d \
     --name scheduling-platform-postgres \
     -e POSTGRES_DB=hr_scheduler \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 \
     docker.io/library/postgres:16-alpine
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```text
src/
  app/
    (auth)/login/
    (app)/
      dashboard/
      meetings/
      admin/users/
  components/
    ui/
  lib/
prisma/
docker-compose.yml
.env.example
```

## Notes

- The current pages are UI scaffolds intended to establish the app structure.
- Prisma schema, migrations, seed data, and credentials-based auth are implemented.
- Meeting APIs and database-backed UI flows are the next major implementation step.
- Auth.js requires `AUTH_TRUST_HOST="true"` for local credentials auth in this setup.
