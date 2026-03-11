import { prisma } from "../prisma/client.js";
import type {
  CreateDirectMessageInput,
  CreateSocialNetworkMessageInput,
  DeleteMessageResult,
  ListMessagesParams,
  ListMessagesResult,
  MessageRecord,
} from "../../../api/v1/modules/messages/messages.types.js";

const messageSelect = {
  id: true,
  senderId: true,
  recipientId: true,
  socialNetworkId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  sender: { select: { id: true, name: true, email: true } },
  recipient: { select: { id: true, name: true, email: true } },
  socialNetwork: { select: { id: true, name: true } },
} as const;

export async function createDirectMessage(input: CreateDirectMessageInput): Promise<MessageRecord> {
  const created = await prisma.message.create({
    data: {
      senderId: input.senderId,
      recipientId: input.recipientId,
      socialNetworkId: null,
      content: input.content,
    },
    select: messageSelect,
  });

  return created as unknown as MessageRecord;
}

export async function createSocialNetworkMessage(input: CreateSocialNetworkMessageInput): Promise<MessageRecord> {
  const created = await prisma.message.create({
    data: {
      senderId: input.senderId,
      recipientId: null,
      socialNetworkId: input.socialNetworkId,
      content: input.content,
    },
    select: messageSelect,
  });

  return created as unknown as MessageRecord;
}

export async function listDirectMessagesBetweenUsers(
  userAId: string,
  userBId: string,
  params: ListMessagesParams = {}
): Promise<ListMessagesResult> {
  const { skip = 0, take = 20 } = params;

  const where = {
    socialNetworkId: null,
    OR: [
      { senderId: userAId, recipientId: userBId },
      { senderId: userBId, recipientId: userAId },
    ],
  };

  const [items, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: messageSelect,
    }),
    prisma.message.count({ where }),
  ]);

  return { items: items as unknown as MessageRecord[], total };
}

export async function listSocialNetworkMessages(
  socialNetworkId: string,
  params: ListMessagesParams = {}
): Promise<ListMessagesResult> {
  const { skip = 0, take = 20 } = params;

  const where = { socialNetworkId };

  const [items, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: messageSelect,
    }),
    prisma.message.count({ where }),
  ]);

  return { items: items as unknown as MessageRecord[], total };
}

export async function getMessageById(id: string): Promise<MessageRecord | null> {
  return prisma.message.findUnique({
    where: { id },
    select: messageSelect,
  }) as Promise<MessageRecord | null>;
}

export async function deleteMessage(id: string): Promise<DeleteMessageResult> {
  const deleted = await prisma.message.delete({
    where: { id },
    select: { id: true },
  });

  return deleted as DeleteMessageResult;
}

export default {
  createDirectMessage,
  createSocialNetworkMessage,
  listDirectMessagesBetweenUsers,
  listSocialNetworkMessages,
  getMessageById,
  deleteMessage,
};
