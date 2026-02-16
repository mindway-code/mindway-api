import type { Request, Response } from "express";
import { listUsersService } from "./users.service.js";
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

export default { listUsersController };
