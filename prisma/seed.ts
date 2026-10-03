import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient, Role, MeetingStatus, InviteStatus } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding.");
}

const pool = new Pool({
  connectionString,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const DEFAULT_PASSWORD = "password123";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function setTime(date: Date, hours: number, minutes: number) {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

async function upsertUser(input: {
  email: string;
  name: string;
  role: Role;
  department?: string;
  password: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      department: input.department,
      password: input.password,
    },
    create: input,
  });
}

async function main() {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = await Promise.all([
    upsertUser({
      email: "admin@company.com",
      name: "Avery Brooks",
      role: Role.admin,
      department: "HR Leadership",
      password,
    }),
    upsertUser({
      email: "hr1@company.com",
      name: "Riley Carter",
      role: Role.hr,
      department: "Human Resources",
      password,
    }),
    upsertUser({
      email: "hr2@company.com",
      name: "Taylor Morgan",
      role: Role.hr,
      department: "Human Resources",
      password,
    }),
    upsertUser({
      email: "employee1@company.com",
      name: "Jordan Smith",
      role: Role.employee,
      department: "Engineering",
      password,
    }),
    upsertUser({
      email: "employee2@company.com",
      name: "Casey Lee",
      role: Role.employee,
      department: "Design",
      password,
    }),
    upsertUser({
      email: "employee3@company.com",
      name: "Jamie Rivera",
      role: Role.employee,
      department: "Finance",
      password,
    }),
    upsertUser({
      email: "employee4@company.com",
      name: "Morgan Chen",
      role: Role.employee,
      department: "Operations",
      password,
    }),
    upsertUser({
      email: "employee5@company.com",
      name: "Alex Johnson",
      role: Role.employee,
      department: "Sales",
      password,
    }),
  ]);

  const [admin, hr1, hr2, employee1, employee2, employee3, employee4, employee5] =
    users;

  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();

  const now = new Date();

  await prisma.meeting.create({
    data: {
      title: "Quarterly performance check-in",
      description:
        "HR-led discussion to review goals, feedback, and follow-up actions.",
      location: "Room Atlas",
      startTime: setTime(addDays(now, 1), 9, 0),
      endTime: setTime(addDays(now, 1), 10, 0),
      status: MeetingStatus.scheduled,
      organizerId: hr1.id,
      participants: {
        create: [
          {
            userId: employee1.id,
            status: InviteStatus.accepted,
          },
          {
            userId: employee4.id,
            status: InviteStatus.pending,
          },
          {
            userId: employee5.id,
            status: InviteStatus.declined,
          },
        ],
      },
    },
  });

  await prisma.meeting.create({
    data: {
      title: "Benefits onboarding session",
      description:
        "Walkthrough of payroll, health benefits, and PTO policy for new hires.",
      location: "Training Room B",
      startTime: setTime(addDays(now, 3), 13, 30),
      endTime: setTime(addDays(now, 3), 14, 30),
      status: MeetingStatus.scheduled,
      organizerId: hr2.id,
      participants: {
        create: [
          {
            userId: employee2.id,
            status: InviteStatus.pending,
          },
          {
            userId: employee3.id,
            status: InviteStatus.accepted,
          },
          {
            userId: employee4.id,
            status: InviteStatus.accepted,
          },
        ],
      },
    },
  });

  await prisma.meeting.create({
    data: {
      title: "Leadership compensation review",
      description:
        "Admin review retained as a completed sample meeting for historical views.",
      location: "Executive Conference Room",
      startTime: setTime(addDays(now, -2), 15, 0),
      endTime: setTime(addDays(now, -2), 16, 0),
      status: MeetingStatus.completed,
      organizerId: admin.id,
      participants: {
        create: [
          {
            userId: hr1.id,
            status: InviteStatus.accepted,
          },
          {
            userId: hr2.id,
            status: InviteStatus.accepted,
          },
        ],
      },
    },
  });

  console.log("Seeded users and meetings.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
