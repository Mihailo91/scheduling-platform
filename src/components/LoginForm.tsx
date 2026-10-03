"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { authenticate, type LoginFormState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginFormState = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
      <ArrowRight className="size-4" />
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Sign in to Scheduling Platform</CardTitle>
        <CardDescription>
          Use a seeded account to enter the internal HR scheduling workspace.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="hr1@company.com"
                className="pl-9"
                aria-invalid={Boolean(state?.errors?.email?.length)}
              />
            </div>
            {state?.errors?.email?.map((error) => (
              <p key={error} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="password123"
                className="pl-9"
                aria-invalid={Boolean(state?.errors?.password?.length)}
              />
            </div>
            {state?.errors?.password?.map((error) => (
              <p key={error} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>

          {state?.message ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Seeded password: <span className="font-medium">password123</span>
          </p>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
