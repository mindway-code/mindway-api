import { pagination } from "../../../../utils/pagination.js";
import { buildCacheKey, getOrSetCached, invalidateCachePatterns } from "../../../../utils/cache.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createAppointment,
  listAppointmentsByUser,
  listAppointmentsByTherapist,
  updateAppointment,
  deleteAppointment,
} from "../../../../infra/database/repositories/appointments.repository.js";
import type {
  CreateAppointmentDTO,
  CreateAppointmentInput,
  ListAppointmentsResponse,
  UpdateAppointmentDTO,
  UpdateAppointmentInput,
  AppointmentStatus,
} from "./appointments.types.js";

const APPOINTMENTS_CACHE_TTL_SECONDS = 300;
const APPOINTMENTS_CACHE_PATTERNS = ["appointments:user:*", "appointments:therapist:*"];

async function invalidateAppointmentsCache() {
  await invalidateCachePatterns(APPOINTMENTS_CACHE_PATTERNS);
}

function parseStatus(raw: unknown): AppointmentStatus {
  if (
    raw === "scheduled" ||
    raw === "confirmed" ||
    raw === "completed" ||
    raw === "canceled" ||
    raw === "no_show"
  )
    return raw as AppointmentStatus;
    else return "scheduled";
}

export async function createAppointmentService(dto: CreateAppointmentDTO) {
  const therapistId = dto.therapistId?.trim();
  const userId = dto.userId?.trim();
  const title = dto.title?.trim();

  if (!therapistId) throw badRequest("therapistId is required", 400);
  if (!userId) throw badRequest("userId is required", 400);
  if (!dto.startsAt) throw badRequest("startsAt is required", 400);
  if (!dto.endsAt) throw badRequest("endsAt is required", 400);

  const startsAt = typeof dto.startsAt === "string" ? new Date(dto.startsAt) : dto.startsAt;
  const endsAt = typeof dto.endsAt === "string" ? new Date(dto.endsAt) : dto.endsAt;

  const input: CreateAppointmentInput = {
    therapistId,
    userId,
    status: parseStatus(dto.status),
    title: title ?? null,
    startsAt: startsAt as Date,
    endsAt: endsAt as Date,
    note: dto.note ?? null,
    feedback: dto.feedback ?? null,
  };

  const created = await createAppointment(input);
  await invalidateAppointmentsCache();

  return created;
}

export async function listAppointmentsByUserService(
  userId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown,
  statusRaw?: AppointmentStatus
): Promise<ListAppointmentsResponse> {
  if (!userId) throw badRequest("userId is required", 400);

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const status = parseStatus(statusRaw) ?? undefined;
  const cacheKey = buildCacheKey("appointments:user", [
    ["userId", userId],
    ["status", status],
    ["page", page],
    ["pageSize", pageSize],
  ]);

  return getOrSetCached({
    key: cacheKey,
    ttlSeconds: APPOINTMENTS_CACHE_TTL_SECONDS,
    load: async () => {
      const { items, total } = await listAppointmentsByUser(userId, { status, skip, take });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
    },
  });
}

export async function listAppointmentsByTherapistService(
  therapistId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown,
  statusRaw?: AppointmentStatus
): Promise<ListAppointmentsResponse> {
  if (!therapistId) throw badRequest("therapistId is required", 400);

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const status = parseStatus(statusRaw) ?? undefined;
  const cacheKey = buildCacheKey("appointments:therapist", [
    ["therapistId", therapistId],
    ["status", status],
    ["page", page],
    ["pageSize", pageSize],
  ]);

  return getOrSetCached({
    key: cacheKey,
    ttlSeconds: APPOINTMENTS_CACHE_TTL_SECONDS,
    load: async () => {
      const { items, total } = await listAppointmentsByTherapist(therapistId, { status, skip, take });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
    },
  });
}

export async function updateAppointmentService(id: string, dto: UpdateAppointmentDTO) {
  if (!id) throw badRequest("Appointment id is required", 400);

  const status = dto.status !== undefined ? parseStatus(dto.status) : undefined;

  const input: UpdateAppointmentInput = {
    ...(status !== undefined ? { status } : {}),
    ...(dto.title !== undefined ? { title: dto.title } : {}),
    ...(dto.startsAt !== undefined ?  {startsAt:  dto.startsAt} : {}),
    ...(dto.endsAt !== undefined ?  {endsAt:  dto.endsAt} : {}),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
    ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
  };

  const updated = await updateAppointment(id, input);
  await invalidateAppointmentsCache();

  return updated;
}

export async function deleteAppointmentService(id: string) {
  if (!id) throw badRequest("Appointment id is required", 400);
  const deleted = await deleteAppointment(id);
  await invalidateAppointmentsCache();

  return deleted;
}

export default {
  createAppointmentService,
  listAppointmentsByUserService,
  listAppointmentsByTherapistService,
  updateAppointmentService,
  deleteAppointmentService,
};
