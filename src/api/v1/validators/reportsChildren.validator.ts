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
});

export const updateReportsChildSchema = z.object({
  title: z.string().min(1).optional(),
  behavior: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
});

export default {
  childIdParamsSchema,
  reportIdParamsSchema,
  listReportsChildrenQuerySchema,
  createReportsChildSchema,
  updateReportsChildSchema,
};

