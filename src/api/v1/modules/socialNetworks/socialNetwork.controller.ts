import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
  listSocialNetworksService,
  createSocialNetworkService,
  updateSocialNetworkService,
  deleteSocialNetworkService,
} from "./socialNetwork.service.js";

export async function listSocialNetworksController(req: Request, res: Response) {
  try {
    const { page, pageSize } = req.query;
    const result = await listSocialNetworksService(page, pageSize);

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createSocialNetworkController(req: Request, res: Response) {
  try {
    const created = await createSocialNetworkService(req.body);
    return sendSuccess(res, created, "SocialNetwork created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateSocialNetworkController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const updated = await updateSocialNetworkService(id, req.body);
    return sendSuccess(res, updated, "SocialNetwork updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteSocialNetworkController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const deleted = await deleteSocialNetworkService(id);
    return sendSuccess(res, deleted, "SocialNetwork deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  listSocialNetworksController,
  createSocialNetworkController,
  updateSocialNetworkController,
  deleteSocialNetworkController,
};
