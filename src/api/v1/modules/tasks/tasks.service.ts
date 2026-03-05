import { pagination } from "../../../../utils/pagination.js";
import { badRequest } from "../../../../core/errors/httpError.js";
import {
  createTask,
  listTasksByUser,
  listTasksByTherapist,
  updateTask,
  deleteTask,
} from "../../../../infra/database/repositories/tasks.repository.js";
import {
  CreateTaskDTO,
  ListTasksResponse,
  UpdateTaskDTO,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from "./tasks.types.js";

function parseStatus(raw: unknown): TaskStatus {
  if (raw === "pending" || raw === "in_progress" || raw === "done" || raw === "canceled") return raw;
  return raw = "pending";
}

export async function createTaskService(dto: CreateTaskDTO) {
  const therapistId = dto.therapistId?.trim();
  const userId = dto.userId?.trim();
  const title = dto.title?.trim();

  if (!therapistId) throw badRequest("therapistId is required", 400);
  if (!userId) throw badRequest("userId is required", 400);
  if (!title) throw badRequest("title is required", 400);

  const input: CreateTaskInput = {
    therapistId,
    userId,
    title,
    status: parseStatus(dto.status),
    description: dto.description ?? null,
    feedback: dto.feedback ?? null,
    note: dto.note ?? null,
  };

  return createTask(input);
}


export async function listTasksByUserService(
  userId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown,
  statusRaw?: TaskStatus
): Promise<ListTasksResponse> {
  if (!userId) throw badRequest("userId is required", 400);

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const status = parseStatus(statusRaw);

  const { items, total } = await listTasksByUser(userId, { status, skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
}


export async function listTasksByTherapistService(
  therapistId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown,
  statusRaw?: TaskStatus
): Promise<ListTasksResponse> {
  if (!therapistId) throw badRequest("therapistId is required", 400);

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);
  const status = parseStatus(statusRaw);

  const { items, total } = await listTasksByTherapist(therapistId, { status, skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
}


export async function updateTaskService(id: string, dto: UpdateTaskDTO) {
  if (!id) throw badRequest("Task id is required", 400);
  if (!dto?.status) throw badRequest("status is required", 400);

  const status = parseStatus(dto.status);
  if (!status) throw badRequest("Invalid status", 400);

  const input: UpdateTaskInput = {
    status,
    ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.feedback !== undefined ? { feedback: dto.feedback } : {}),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
  };


  if (dto.title !== undefined && !input.title) {
    throw badRequest("title cannot be empty", 400);
  }

  return updateTask(id, input);
}


export async function deleteTaskService(id: string) {
  if (!id) throw badRequest("Task id is required", 400);
  return deleteTask(id);
}

export default {
  createTaskService,
  listTasksByUserService,
  listTasksByTherapistService,
  updateTaskService,
  deleteTaskService,
};
