"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password is too long."),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function authenticate(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields and try again.",
    };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          message: "Invalid email or password.",
        };
      }

      return {
        message: "Something went wrong while signing you in.",
      };
    }

    throw error;
  }
}
