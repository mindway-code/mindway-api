import { pagination } from "../../../../utils/pagination.js";
import { badRequest, forbidden, notFound } from "../../../../core/errors/httpError.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import { isSocialNetworkMember } from "../../../../infra/database/repositories/socialNetworkUsers.repository.js";
import {
  createDirectMessage,
  createSocialNetworkMessage,
  deleteMessage,
  getMessageById,
  listDirectMessagesBetweenUsers,
  listSocialNetworkMessages,
} from "../../../../infra/database/repositories/messages.repository.js";
import type { CreateMessageDTO, ListMessagesResponse } from "./messages.types.js";

function normalizeContent(raw: unknown): string {
  const content = typeof raw === "string" ? raw.trim() : "";
  if (!content) throw badRequest("content is required");
  return content;
}

export async function createDirectMessageService(senderId: string, recipientId: string, dto: CreateMessageDTO) {
  if (!senderId) throw badRequest("senderId is required");
  if (!recipientId) throw badRequest("recipientId is required");
  if (senderId === recipientId) throw badRequest("recipientId must be different from senderId");

  const content = normalizeContent(dto?.content);
  return createDirectMessage({ senderId, recipientId, content });
}

export async function createSocialNetworkMessageService(
  senderId: string,
  senderRole: UserRole,
  socialNetworkId: string,
  dto: CreateMessageDTO
) {
  if (!senderId) throw badRequest("senderId is required");
  if (!socialNetworkId) throw badRequest("socialNetworkId is required");

  if (senderRole !== "admin") {
    const isMember = await isSocialNetworkMember(socialNetworkId, senderId);
    if (!isMember) throw forbidden("You are not a member of this social network");
  }

  const content = normalizeContent(dto?.content);
  return createSocialNetworkMessage({ senderId, socialNetworkId, content });
}

export async function listDirectMessagesService(
  meId: string,
  otherUserId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown
): Promise<ListMessagesResponse> {
  if (!meId) throw badRequest("meId is required");
  if (!otherUserId) throw badRequest("userId is required");

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listDirectMessagesBetweenUsers(meId, otherUserId, { skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
}

export async function listSocialNetworkMessagesService(
  requesterId: string,
  requesterRole: UserRole,
  socialNetworkId: string,
  pageRaw: unknown,
  pageSizeRaw: unknown
): Promise<ListMessagesResponse> {
  if (!requesterId) throw badRequest("requesterId is required");
  if (!socialNetworkId) throw badRequest("socialNetworkId is required");

  if (requesterRole !== "admin") {
    const isMember = await isSocialNetworkMember(socialNetworkId, requesterId);
    if (!isMember) throw forbidden("You are not a member of this social network");
  }

  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listSocialNetworkMessages(socialNetworkId, { skip, take });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
}

export async function listSocialNetworkMessagesOffsetService(params: {
  requesterId: string;
  requesterRole: UserRole;
  socialNetworkId: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: unknown[]; total: number }> {
  const { requesterId, requesterRole, socialNetworkId } = params;
  const take = Math.min(100, Math.max(1, Number(params.limit ?? 50) || 50));
  const skip = Math.max(0, Number(params.offset ?? 0) || 0);

  if (!requesterId) throw badRequest("requesterId is required");
  if (!socialNetworkId) throw badRequest("socialNetworkId is required");

  if (requesterRole !== "admin") {
    const isMember = await isSocialNetworkMember(socialNetworkId, requesterId);
    if (!isMember) throw forbidden("You are not a member of this social network");
  }

  return listSocialNetworkMessages(socialNetworkId, { skip, take });
}

export async function deleteMessageService(params: { requesterId: string; requesterRole: UserRole; messageId: string }) {
  const { requesterId, requesterRole, messageId } = params;
  if (!requesterId) throw badRequest("requesterId is required");
  if (!messageId) throw badRequest("messageId is required");

  const existing = await getMessageById(messageId);
  if (!existing) throw notFound("Message not found");

  const canDelete = requesterRole === "admin" || existing.senderId === requesterId;
  if (!canDelete) throw forbidden("You cannot delete this message");

  return deleteMessage(messageId);
}

export default {
  createDirectMessageService,
  createSocialNetworkMessageService,
  listDirectMessagesService,
  listSocialNetworkMessagesService,
  listSocialNetworkMessagesOffsetService,
  deleteMessageService,
};
