import { z } from "zod";

export const createChildSchema = z.object({
  responsibleId: z.string().uuid().optional(),
  secondaryResponsibleId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  age: z.number().int().min(0),
  birthDate: z.union([z.string().min(1), z.date()]),
  observation: z.string().nullable().optional(),
});

export const updateChildSchema = z.object({
  secondaryResponsibleId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).optional(),
  age: z.number().int().min(0).optional(),
  birthDate: z.union([z.string().min(1), z.date()]).optional(),
  observation: z.string().nullable().optional(),
});

export const childIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listChildrenQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const accessCodeParamsSchema = z.object({
  code: z.string().min(6).max(10),
});

export const validateAccessCodeBodySchema = z.object({
  accessCode: z.string().min(6).max(10),
});

export default {
  createChildSchema,
  updateChildSchema,
  childIdParamsSchema,
  listChildrenQuerySchema,
  accessCodeParamsSchema,
  validateAccessCodeBodySchema,
};
