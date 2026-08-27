import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
  createTaskService,
  listTasksByUserService,
  listTasksByTherapistService,
  updateTaskService,
  deleteTaskService,
} from "./tasks.service.js";
import type { TaskStatus } from "./tasks.types.js";


export async function createTaskController(req: Request, res: Response) {
  try {
    const created = await createTaskService(req.body);
    return sendSuccess(res, created, "Task created");
  } catch (err) {
    return sendError(res, err);
  }
}


export async function listMyTasksController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize, status } = req.query;

    const result = await listTasksByUserService(
      userId,
      page,
      pageSize,
      status as TaskStatus | undefined
    );

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}


export async function listMyTherapistTasksController(req: Request, res: Response) {
  try {
    const therapistId = req.user!.id;
    const { page, pageSize, status } = req.query;

    const result = await listTasksByTherapistService(
      therapistId,
      page,
      pageSize,
      status as TaskStatus | undefined
    );

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}


export async function updateTaskController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const updated = await updateTaskService(id, req.body);
    return sendSuccess(res, updated, "Task updated");
  } catch (err) {
    return sendError(res, err);
  }
}


export async function deleteTaskController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const deleted = await deleteTaskService(id);
    return sendSuccess(res, deleted, "Task deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  createTaskController,
  listMyTasksController,
  listMyTherapistTasksController,
  updateTaskController,
  deleteTaskController,
};
