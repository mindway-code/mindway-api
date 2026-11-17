import { z } from "zod";
import { PUBLIC_REGISTRATION_ROLES } from "../modules/auth/auth.types.js";

const passwordSchema = z.string().min(6).max(128);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    role: z.enum(PUBLIC_REGISTRATION_ROLES),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(128),
  })
  .strict();

export default { registerSchema, loginSchema };
