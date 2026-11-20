import { z } from "zod";

const currentPassword = z.string().min(1).max(128);
const totpCode = z.string().regex(/^\d{6}$/);
const mfaCode = z.string().trim().min(6).max(32);

export const startTotpEnrollmentSchema = z.object({ currentPassword }).strict();
export const confirmTotpEnrollmentSchema = z.object({ code: totpCode }).strict();
export const mfaProtectedActionSchema = z.object({ currentPassword, code: mfaCode }).strict();
export const mfaEnrollmentParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const stepUpGrantSchema = z.object({
  method: z.enum(["TOTP", "RECOVERY_CODE"]),
  code: mfaCode,
  action: z.literal("report.validate"),
  resourceType: z.literal("reportRevision"),
  resourceId: z.string().uuid(),
}).strict().superRefine((value, ctx) => {
  if (value.method === "TOTP" && !/^\d{6}$/.test(value.code)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["code"], message: "TOTP code must contain six digits" });
  }
  if (value.method === "RECOVERY_CODE" && /^\d{6}$/.test(value.code)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["code"], message: "A recovery code is required" });
  }
});

export default {
  startTotpEnrollmentSchema,
  confirmTotpEnrollmentSchema,
  mfaProtectedActionSchema,
  mfaEnrollmentParamsSchema,
  stepUpGrantSchema,
};
