import { z } from "zod";

const userRoleSchema = z.enum(["admin", "common", "enterprise", "professional", "therapist"]);

export const createUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().nullable().optional(),
    password: z.string().min(6).max(128).nullable().optional(),
    role: userRoleSchema.optional(),
    provider: z.enum(["local", "google"]).optional(),
    googleId: z.string().min(1).optional(),
  })
  .strict();

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

export const changeMyPasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(6).max(128),
  })
  .strict();

export default { createUserSchema, updateMeSchema, changeMyPasswordSchema };
