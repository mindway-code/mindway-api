import { prisma } from "../prisma/client.js";
import type {
  TaskRecord,
  CreateTaskInput,
  ListTasksParams,
  ListTasksResult,
  UpdateTaskInput,
  DeleteTaskResult,
} from "../../../api/v1/modules/tasks/tasks.types.js";

const taskSelect = {
  id: true,
  therapistId: true,
  userId: true,
  status: true,
  title: true,
  description: true,
  feedback: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  therapist: { select: { id: true, name: true, email: true } },
  user: { select: { id: true, name: true, email: true } },
} as const;


export async function createTask(input: CreateTaskInput): Promise<TaskRecord> {
  const created = await prisma.task.create({
    data: {
      therapistId: input.therapistId,
      userId: input.userId,
      status: input.status ?? "pending",
      title: input.title,
      description: input.description ?? null,
      feedback: input.feedback ?? null,
      note: input.note ?? null,
    },
    select: taskSelect,
  });

  return created as unknown as TaskRecord;
}



export async function listTasksByUser(
  userId: string,
  params: ListTasksParams = {}
): Promise<ListTasksResult> {
  const { status, skip = 0, take = 20 } = params;

  const where = status ? { userId, status } : { userId };

  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: taskSelect,
    }),
    prisma.task.count({ where }),
  ]);

  return { items: items as unknown as TaskRecord[], total };
}

export async function listTasksByTherapist(
  therapistId: string,
  params: ListTasksParams = {}
): Promise<ListTasksResult> {
  const { status, skip = 0, take = 20 } = params;

  const where = status ? { therapistId, status } : { therapistId };

  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: taskSelect,
    }),
    prisma.task.count({ where }),
  ]);

  return { items: items as unknown as TaskRecord[], total };
}


export async function updateTask(id: string, input: UpdateTaskInput): Promise<TaskRecord> {
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
    select: taskSelect,
  });

  return updated as unknown as TaskRecord;
}

export async function deleteTask(id: string): Promise<DeleteTaskResult> {
  const deleted = await prisma.task.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createTask,
  listTasksByUser,
  listTasksByTherapist,
  updateTask,
  deleteTask,
};
