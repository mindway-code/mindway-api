import { badRequest, notFound } from "../../../../core/errors/httpError.js";
import { getChildByIdService } from "../children/children.service.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import {
  createAnamnesis,
  deleteBehavior,
  deleteBirth,
  deleteHealth,
  deleteLanguageCommunication,
  deleteMotorDevelopment,
  deleteRoutine,
  getAnamnesisByChildId,
  updateGeneralNotes,
  upsertBehavior,
  upsertBirth,
  upsertHealth,
  upsertLanguageCommunication,
  upsertMotorDevelopment,
  upsertRoutine,
} from "../../../../infra/database/repositories/anamnesis.repository.js";
import type {
  AnamnesisRecord,
  UpdateAnamnesisGeneralNotesDTO,
  UpsertAnamnesisBehaviorDTO,
  UpsertAnamnesisBirthDTO,
  UpsertAnamnesisHealthDTO,
  UpsertAnamnesisLanguageCommunicationDTO,
  UpsertAnamnesisMotorDevelopmentDTO,
  UpsertAnamnesisRoutineDTO,
} from "./anamnesis.types.js";

async function ensureCanAccessChild(params: { requesterId: string; requesterRole: UserRole; childId: string }) {
  const { requesterId, requesterRole, childId } = params;
  if (!requesterId) throw badRequest("requesterId is required");
  if (!childId) throw badRequest("childId is required");

  // Reuse children access rules (admin/common with responsibility check).
  await getChildByIdService({ requesterId, requesterRole, childId });
}

export async function getAnamnesisByChildIdService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<AnamnesisRecord | null> {
  await ensureCanAccessChild(params);
  return getAnamnesisByChildId(params.childId);
}

export async function createAnamnesisService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);

  const existing = await getAnamnesisByChildId(params.childId);
  if (existing) return existing;

  return createAnamnesis(params.childId);
}

export async function updateGeneralNotesService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpdateAnamnesisGeneralNotesDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);

  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  const generalNotes = params.dto.generalNotes ?? null;
  return updateGeneralNotes(existing.id, generalNotes);
}

export async function upsertBirthService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisBirthDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertBirth(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteBirthService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.birth) return;
  await deleteBirth(existing.id);
}

export async function upsertMotorDevelopmentService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisMotorDevelopmentDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertMotorDevelopment(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteMotorDevelopmentService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.motorDevelopment) return;
  await deleteMotorDevelopment(existing.id);
}

export async function upsertLanguageCommunicationService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisLanguageCommunicationDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertLanguageCommunication(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteLanguageCommunicationService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.languageCommunication) return;
  await deleteLanguageCommunication(existing.id);
}

export async function upsertHealthService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisHealthDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertHealth(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteHealthService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.health) return;
  await deleteHealth(existing.id);
}

export async function upsertBehaviorService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisBehaviorDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertBehavior(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteBehaviorService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.behavior) return;
  await deleteBehavior(existing.id);
}

export async function upsertRoutineService(params: {
  requesterId: string;
  requesterRole: UserRole;
  childId: string;
  dto: UpsertAnamnesisRoutineDTO;
}): Promise<AnamnesisRecord> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  await upsertRoutine(existing.id, params.dto);
  const updated = await getAnamnesisByChildId(params.childId);
  if (!updated) throw notFound("Anamnesis not found");
  return updated;
}

export async function deleteRoutineService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<void> {
  await ensureCanAccessChild(params);
  const existing = await getAnamnesisByChildId(params.childId);
  if (!existing) throw notFound("Anamnesis not found");

  if (!existing.routine) return;
  await deleteRoutine(existing.id);
}

export default {
  getAnamnesisByChildIdService,
  createAnamnesisService,
  updateGeneralNotesService,
  upsertBirthService,
  deleteBirthService,
  upsertMotorDevelopmentService,
  deleteMotorDevelopmentService,
  upsertLanguageCommunicationService,
  deleteLanguageCommunicationService,
  upsertHealthService,
  deleteHealthService,
  upsertBehaviorService,
  deleteBehaviorService,
  upsertRoutineService,
  deleteRoutineService,
};
