import { z } from "zod";

export const childIdParamsSchema = z.object({
  childId: z.string().uuid(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listReportsChildrenQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createReportsChildSchema = z.object({
  title: z.string().min(1),
  behavior: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  accessCode: z.string().min(6).max(10).optional(),
}).strict();

export const updateReportsChildSchema = z.object({
  title: z.string().min(1).optional(),
  behavior: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const rejectReportSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
}).strict();

export default {
  childIdParamsSchema,
  reportIdParamsSchema,
  listReportsChildrenQuerySchema,
  createReportsChildSchema,
  updateReportsChildSchema,
  rejectReportSchema,
};

