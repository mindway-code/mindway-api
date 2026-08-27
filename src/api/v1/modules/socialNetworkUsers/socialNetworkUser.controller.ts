import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
  listSocialNetworkUsersService,
  createSocialNetworkUserService,
  getSocialNetworkUserByIdService,
  updateSocialNetworkUserService,
  deleteSocialNetworkUserService,
} from "./socialNetworkUser.service.js";

export async function listSocialNetworkUsersController(req: Request, res: Response) {
  try {
    const { page, pageSize, socialNetworkId, userId } = req.query;
    const result = await listSocialNetworkUsersService(page, pageSize, socialNetworkId, userId);

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createSocialNetworkUserController(req: Request, res: Response) {
  try {
    const created = await createSocialNetworkUserService(req.body);
    return sendSuccess(res, created, "SocialNetworkUser created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function getSocialNetworkUserByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const item = await getSocialNetworkUserByIdService(id);
    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateSocialNetworkUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const updated = await updateSocialNetworkUserService(id, req.body);
    return sendSuccess(res, updated, "SocialNetworkUser updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteSocialNetworkUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const deleted = await deleteSocialNetworkUserService(id);
    return sendSuccess(res, deleted, "SocialNetworkUser deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  listSocialNetworkUsersController,
  createSocialNetworkUserController,
  getSocialNetworkUserByIdController,
  updateSocialNetworkUserController,
  deleteSocialNetworkUserController,
};
