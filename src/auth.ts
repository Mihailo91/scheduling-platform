import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long."),
});

const protectedRoutePrefixes = ["/dashboard", "/meetings", "/admin"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "hr@company.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      authorize: async (credentials) => {
        const validatedCredentials = credentialsSchema.safeParse(credentials);

        if (!validatedCredentials.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: validatedCredentials.data.email,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          validatedCredentials.data.password,
          user.password,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginRoute = nextUrl.pathname === "/login";
      const isProtectedRoute = protectedRoutePrefixes.some((prefix) =>
        nextUrl.pathname.startsWith(prefix),
      );

      if (isLoginRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.department = user.department ?? null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.employee;
        session.user.department =
          (token.department as string | null | undefined) ?? null;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name ?? "";
      }

      return session;
    },
  },
});
