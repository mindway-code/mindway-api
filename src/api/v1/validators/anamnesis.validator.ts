import { z } from "zod";

export const childIdParamsSchema = z.object({
  childId: z.string().uuid(),
});

export const updateGeneralNotesSchema = z.object({
  generalNotes: z.string().nullable().optional(),
});

export const upsertBirthSchema = z.object({
  gestationalWeeks: z.number().int().min(0).nullable().optional(),
  birthType: z.string().min(1).nullable().optional(),
  birthWeightGrams: z.number().int().min(0).nullable().optional(),
  birthHeightCentimeters: z.number().int().min(0).nullable().optional(),
  apgarOneMinute: z.number().int().min(0).max(10).nullable().optional(),
  apgarFiveMinutes: z.number().int().min(0).max(10).nullable().optional(),
  birthComplication: z.string().min(1).nullable().optional(),
  hospitalizationDays: z.number().int().min(0).nullable().optional(),
});

export const upsertMotorDevelopmentSchema = z.object({
  neckControlAgeMonths: z.number().int().min(0).nullable().optional(),
  sittingAgeMonths: z.number().int().min(0).nullable().optional(),
  crawlingAgeMonths: z.number().int().min(0).nullable().optional(),
  firstStepsAgeMonths: z.number().int().min(0).nullable().optional(),
  fineCoordination: z.string().min(1).nullable().optional(),
});

export const upsertLanguageCommunicationSchema = z.object({
  firstWordsAgeMonths: z.number().int().min(0).nullable().optional(),
  fullSentencesAgeMonths: z.number().int().min(0).nullable().optional(),
  comprehension: z.string().min(1).nullable().optional(),
  currentCommunication: z.string().min(1).nullable().optional(),
});

export const upsertHealthSchema = z.object({
  diagnosis: z.string().min(1).nullable().optional(),
  medication: z.string().min(1).nullable().optional(),
  allergies: z.string().min(1).nullable().optional(),
});

export const upsertBehaviorSchema = z.object({
  concentrationDifficulty: z.string().min(1).nullable().optional(),
  interaction: z.string().min(1).nullable().optional(),
  activityPreference: z.string().min(1).nullable().optional(),
  anxiety: z.string().min(1).nullable().optional(),
  hyperactivity: z.string().min(1).nullable().optional(),
});

export const upsertRoutineSchema = z.object({
  wakesUpAt: z.string().min(1).nullable().optional(),
  therapies: z.string().min(1).nullable().optional(),
  schoolPeriod: z.string().min(1).nullable().optional(),
  extraActivity: z.string().min(1).nullable().optional(),
  sleepsAt: z.string().min(1).nullable().optional(),
  routineObservation: z.string().min(1).nullable().optional(),
});

export default {
  childIdParamsSchema,
  updateGeneralNotesSchema,
  upsertBirthSchema,
  upsertMotorDevelopmentSchema,
  upsertLanguageCommunicationSchema,
  upsertHealthSchema,
  upsertBehaviorSchema,
  upsertRoutineSchema,
};

