import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import {
  createChildService,
  deleteChildService,
  getChildByAccessCodeService,
  getChildByIdService,
  listChildrenService,
  listMyChildrenService,
  updateChildService,
} from "./children.service.js";

export async function createChildController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const dto = req.body as import("./children.types.js").CreateChildDTO;

    const created = await createChildService({ requesterId, requesterRole, dto });
    return sendSuccess(res, created, "Child created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listChildrenController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { page, pageSize } = req.query;

    const result = await listChildrenService({ requesterId, requesterRole, pageRaw: page, pageSizeRaw: pageSize });
    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listMyChildrenController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;

    const children = await listMyChildrenService({ requesterId });
    return sendSuccess(res, children);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function getChildByIdController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };

    const child = await getChildByIdService({ requesterId, requesterRole, childId: id });
    return sendSuccess(res, child);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateChildController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };
    const dto = req.body as import("./children.types.js").UpdateChildDTO;

    const updated = await updateChildService({ requesterId, requesterRole, childId: id, dto });
    return sendSuccess(res, updated, "Child updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteChildController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };

    const deleted = await deleteChildService({ requesterId, requesterRole, childId: id });
    return sendSuccess(res, deleted, "Child deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function getChildByAccessCodeController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { code } = req.params as { code: string };

    const child = await getChildByAccessCodeService({ requesterId, requesterRole, accessCode: code });
    return sendSuccess(res, child);
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  createChildController,
  listChildrenController,
  listMyChildrenController,
  getChildByIdController,
  updateChildController,
  deleteChildController,
  getChildByAccessCodeController,
};
