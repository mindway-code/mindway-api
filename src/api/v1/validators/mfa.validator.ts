import { z } from "zod";

const currentPassword = z.string().min(1).max(128);
const totpCode = z.string().regex(/^\d{6}$/);
const mfaCode = z.string().trim().min(6).max(32);

export const startTotpEnrollmentSchema = z.object({ currentPassword }).strict();
export const confirmTotpEnrollmentSchema = z.object({ code: totpCode }).strict();
export const mfaProtectedActionSchema = z.object({ currentPassword, code: mfaCode }).strict();
export const mfaEnrollmentParamsSchema = z.object({ id: z.string().uuid() }).strict();

export default {
  startTotpEnrollmentSchema,
  confirmTotpEnrollmentSchema,
  mfaProtectedActionSchema,
  mfaEnrollmentParamsSchema,
};
