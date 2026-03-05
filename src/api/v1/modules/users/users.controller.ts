import type { Request, Response } from "express";
import {
  listUsersService,
  getMeService,
  createUserService,
  updateUserService,
  deleteUserService,
} from "./users.service.js";
import { sendSuccess, sendError } from "../../../../utils/response.js";

export async function listUsersController(req: Request, res: Response) {
  try {
    const { page, pageSize } = req.query;
    const result = await listUsersService(page, pageSize);

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}


export async function getMeController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const me = await getMeService(userId);
    return sendSuccess(res, me);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createUserController(req: Request, res: Response) {
  try {
    const dto = req.body;
    const created = await createUserService(dto);
    return sendSuccess(res, created, "User created");
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * PATCH /users/me
 * (If you prefer PATCH /users/:id for admin, adapt easily.)
 */
export async function updateUserController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const dto = req.body;

    const updated = await updateUserService(userId, dto);
    return sendSuccess(res, updated, "User updated");
  } catch (err) {
    return sendError(res, err);
  }
}


export async function deleteUserController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const result = await deleteUserService(userId);
    return sendSuccess(res, result, "User deleted");
  } catch (err) {
    return sendError(res, err);
  }
}


export default {
  listUsersController,
  getMeController,
  createUserController,
  updateUserController,
  deleteUserController,
};
