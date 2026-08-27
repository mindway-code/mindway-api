import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import {
  createDirectMessageService,
  createSocialNetworkMessageService,
  deleteMessageService,
  listDirectMessagesService,
  listSocialNetworkMessagesService,
} from "./messages.service.js";

export async function listDirectMessagesController(req: Request, res: Response) {
  try {
    const meId = req.user!.id;
    const { userId } = req.params as { userId: string };
    const { page, pageSize } = req.query;

    const result = await listDirectMessagesService(meId, userId, page, pageSize);
    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createDirectMessageController(req: Request, res: Response) {
  try {
    const senderId = req.user!.id;
    const { userId } = req.params as { userId: string };
    const created = await createDirectMessageService(senderId, userId, req.body);
    return sendSuccess(res, created, "Message sent");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listSocialNetworkMessagesController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { socialNetworkId } = req.params as { socialNetworkId: string };
    const { page, pageSize } = req.query;

    const result = await listSocialNetworkMessagesService(requesterId, requesterRole, socialNetworkId, page, pageSize);
    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createSocialNetworkMessageController(req: Request, res: Response) {
  try {
    const senderId = req.user!.id;
    const senderRole = req.user!.role;
    const { socialNetworkId } = req.params as { socialNetworkId: string };
    const created = await createSocialNetworkMessageService(senderId, senderRole, socialNetworkId, req.body);
    return sendSuccess(res, created, "Message sent");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteMessageController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;

    const deleted = await deleteMessageService({ requesterId, requesterRole, messageId: id });
    return sendSuccess(res, deleted, "Message deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export function messagesOkController(_req: Request, res: Response) {
  const data = {};
  const message = "Messages Routes Ok";
  return sendSuccess(res, data, message);
}

export default {
  listDirectMessagesController,
  createDirectMessageController,
  listSocialNetworkMessagesController,
  createSocialNetworkMessageController,
  deleteMessageController,
  messagesOkController,
};
