import { z } from "zod";

const emailSchema = z.string().trim().min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: emailSchema,

    password: z.string().min(1, "Password is required"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const resetPasswordField = (requiredMessage: string) => z.string()
  .min(1, requiredMessage)
  .pipe(z.string().min(6, "Password must be at least 6 characters long"));

export const resetPasswordSchema = z.object({
  newPassword: resetPasswordField("Password is required"),
  confirmPassword: resetPasswordField("Confirm password is required"),
}).refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
