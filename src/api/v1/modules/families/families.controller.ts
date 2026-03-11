import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
  listFamiliesService,
  listMyFamiliesService,
  createFamilyService,
  getFamilyByIdService,
  updateFamilyService,
  deleteFamilyService,
} from "./families.service.js";

export async function listFamiliesController(req: Request, res: Response) {
  try {
    const { page, pageSize } = req.query;
    const result = await listFamiliesService(page, pageSize);

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listMyFamiliesController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize } = req.query;
    const result = await listMyFamiliesService(userId, page, pageSize);

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createFamilyController(req: Request, res: Response) {
  try {
    const { name } = req.body as { name?: string };
    const created = await createFamilyService({ name: name ?? "" });

    return sendSuccess(res, created, "Family created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function getFamilyByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const family = await getFamilyByIdService(id);

    return sendSuccess(res, family);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateFamilyController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { name } = req.body as { name: string };

    const updated = await updateFamilyService(id, { name });

    return sendSuccess(res, updated, "Family updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteFamilyController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const deleted = await deleteFamilyService(id);

    return sendSuccess(res, deleted, "Family deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  listFamiliesController,
  listMyFamiliesController,
  createFamilyController,
  getFamilyByIdController,
  updateFamilyController,
  deleteFamilyController,
};
