import { prisma } from "../prisma/client.js";
import type {
  AnamnesisRecord,
  UpsertAnamnesisBehaviorDTO,
  UpsertAnamnesisBirthDTO,
  UpsertAnamnesisHealthDTO,
  UpsertAnamnesisLanguageCommunicationDTO,
  UpsertAnamnesisMotorDevelopmentDTO,
  UpsertAnamnesisRoutineDTO,
} from "../../../api/v1/modules/anamnesis/anamnesis.types.js";

const birthSelect = {
  id: true,
  anamnesisId: true,
  gestationalWeeks: true,
  birthType: true,
  birthWeightGrams: true,
  birthHeightCentimeters: true,
  apgarOneMinute: true,
  apgarFiveMinutes: true,
  birthComplication: true,
  hospitalizationDays: true,
  createdAt: true,
  updatedAt: true,
} as const;

const motorDevelopmentSelect = {
  id: true,
  anamnesisId: true,
  neckControlAgeMonths: true,
  sittingAgeMonths: true,
  crawlingAgeMonths: true,
  firstStepsAgeMonths: true,
  fineCoordination: true,
  createdAt: true,
  updatedAt: true,
} as const;

const languageCommunicationSelect = {
  id: true,
  anamnesisId: true,
  firstWordsAgeMonths: true,
  fullSentencesAgeMonths: true,
  comprehension: true,
  currentCommunication: true,
  createdAt: true,
  updatedAt: true,
} as const;

const healthSelect = {
  id: true,
  anamnesisId: true,
  diagnosis: true,
  medication: true,
  allergies: true,
  createdAt: true,
  updatedAt: true,
} as const;

const behaviorSelect = {
  id: true,
  anamnesisId: true,
  concentrationDifficulty: true,
  interaction: true,
  activityPreference: true,
  anxiety: true,
  hyperactivity: true,
  createdAt: true,
  updatedAt: true,
} as const;

const routineSelect = {
  id: true,
  anamnesisId: true,
  wakesUpAt: true,
  therapies: true,
  schoolPeriod: true,
  extraActivity: true,
  sleepsAt: true,
  routineObservation: true,
  createdAt: true,
  updatedAt: true,
} as const;

const anamnesisSelect = {
  id: true,
  childId: true,
  generalNotes: true,
  createdAt: true,
  updatedAt: true,
  birth: { select: birthSelect },
  motorDevelopment: { select: motorDevelopmentSelect },
  languageCommunication: { select: languageCommunicationSelect },
  health: { select: healthSelect },
  behavior: { select: behaviorSelect },
  routine: { select: routineSelect },
} as const;

export async function getAnamnesisByChildId(childId: string): Promise<AnamnesisRecord | null> {
  const record = await prisma.anamnesis.findUnique({
    where: { childId },
    select: anamnesisSelect,
  });

  return record as unknown as AnamnesisRecord | null;
}

export async function createAnamnesis(childId: string): Promise<AnamnesisRecord> {
  const created = await prisma.anamnesis.create({
    data: { childId },
    select: anamnesisSelect,
  });

  return created as unknown as AnamnesisRecord;
}

export async function updateGeneralNotes(anamnesisId: string, generalNotes: string | null): Promise<AnamnesisRecord> {
  const updated = await prisma.anamnesis.update({
    where: { id: anamnesisId },
    data: { generalNotes },
    select: anamnesisSelect,
  });

  return updated as unknown as AnamnesisRecord;
}

export async function upsertBirth(anamnesisId: string, dto: UpsertAnamnesisBirthDTO): Promise<void> {
  await prisma.anamnesisBirth.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteBirth(anamnesisId: string): Promise<void> {
  await prisma.anamnesisBirth.delete({ where: { anamnesisId } });
}

export async function upsertMotorDevelopment(anamnesisId: string, dto: UpsertAnamnesisMotorDevelopmentDTO): Promise<void> {
  await prisma.anamnesisMotorDevelopment.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteMotorDevelopment(anamnesisId: string): Promise<void> {
  await prisma.anamnesisMotorDevelopment.delete({ where: { anamnesisId } });
}

export async function upsertLanguageCommunication(
  anamnesisId: string,
  dto: UpsertAnamnesisLanguageCommunicationDTO
): Promise<void> {
  await prisma.anamnesisLanguageCommunication.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteLanguageCommunication(anamnesisId: string): Promise<void> {
  await prisma.anamnesisLanguageCommunication.delete({ where: { anamnesisId } });
}

export async function upsertHealth(anamnesisId: string, dto: UpsertAnamnesisHealthDTO): Promise<void> {
  await prisma.anamnesisHealth.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteHealth(anamnesisId: string): Promise<void> {
  await prisma.anamnesisHealth.delete({ where: { anamnesisId } });
}

export async function upsertBehavior(anamnesisId: string, dto: UpsertAnamnesisBehaviorDTO): Promise<void> {
  await prisma.anamnesisBehavior.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteBehavior(anamnesisId: string): Promise<void> {
  await prisma.anamnesisBehavior.delete({ where: { anamnesisId } });
}

export async function upsertRoutine(anamnesisId: string, dto: UpsertAnamnesisRoutineDTO): Promise<void> {
  await prisma.anamnesisRoutine.upsert({
    where: { anamnesisId },
    create: { anamnesisId, ...dto },
    update: { ...dto },
  });
}

export async function deleteRoutine(anamnesisId: string): Promise<void> {
  await prisma.anamnesisRoutine.delete({ where: { anamnesisId } });
}

export default {
  getAnamnesisByChildId,
  createAnamnesis,
  updateGeneralNotes,
  upsertBirth,
  deleteBirth,
  upsertMotorDevelopment,
  deleteMotorDevelopment,
  upsertLanguageCommunication,
  deleteLanguageCommunication,
  upsertHealth,
  deleteHealth,
  upsertBehavior,
  deleteBehavior,
  upsertRoutine,
  deleteRoutine,
};

