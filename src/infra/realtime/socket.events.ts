import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { HttpError, badRequest, notFound } from "../../core/errors/httpError.js";
import { logger } from "../../core/logger/logger.js";
import type { SocketUser } from "./socket.auth.js";
import { joinSocialNetworkRoom, leaveSocialNetworkRoom, userRoom, socialNetworkRoom } from "./socket.rooms.js";
import {
  createDirectMessageService,
  createSocialNetworkMessageService,
  deleteMessageService,
  listSocialNetworkMessagesOffsetService,
} from "../../api/v1/modules/messages/messages.service.js";
import { getMessageById } from "../database/repositories/messages.repository.js";

type Ack =
  | ((payload: { ok: true; data?: unknown } | { ok: false; error: { code: string; message: string; details?: unknown } }) => void)
  | undefined;

function ackOk(ack: Ack, data?: unknown) {
  if (typeof ack === "function") ack({ ok: true, ...(data !== undefined ? { data } : {}) });
}

function ackErr(ack: Ack, err: unknown) {
  if (typeof ack !== "function") return;

  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return ack({ ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  }

  if (err instanceof HttpError) {
    return ack({
      ok: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  return ack({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const joinSchema = z.object({
  socialNetworkId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const leaveSchema = z.object({
  socialNetworkId: z.string().min(1),
});

const sendSchema = z.object({
  socialNetworkId: z.string().min(1).optional(),
  recipientId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  content: z.string().min(1),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export function registerMessageEvents(io: Server, socket: Socket) {
  socket.on("joinSocialNetwork", async (raw: unknown, ack?: Ack) => {
    try {
      const limit: number = 10;
      const offset: number = 1;
      const input = joinSchema.parse(raw);

      if (input.limit === undefined) input.limit = limit;
      if (input.offset === undefined) input.offset = offset;

      const user = (socket.data as any).user as SocketUser | undefined;
      if (!user?.id) throw new Error("UNAUTHORIZED");

      await joinSocialNetworkRoom(socket, input.socialNetworkId);

      const history = await listSocialNetworkMessagesOffsetService({
        requesterId: user.id,
        requesterRole: user.role,
        socialNetworkId: input.socialNetworkId,
        limit: limit,
        offset: input.offset,
      });

      socket.emit("messageHistory", history.items);
      ackOk(ack, { joined: true, socialNetworkId: input.socialNetworkId });
    } catch (err) {
      ackErr(ack, err);
    }
  });

  socket.on("leaveSocialNetwork", async (raw: unknown, ack?: Ack) => {
    try {
      const input = leaveSchema.parse(raw);
      await leaveSocialNetworkRoom(socket, input.socialNetworkId);
      ackOk(ack, { left: true, socialNetworkId: input.socialNetworkId });
    } catch (err) {
      ackErr(ack, err);
    }
  });

  socket.on("message", async (raw: unknown, ack?: Ack) => {
    const user = (socket.data as any).user as SocketUser | undefined;

    try {
      if (!user?.id) throw new Error("UNAUTHORIZED");
      const input = sendSchema.parse(raw);

      const recipientId = input.recipientId ?? input.userId;
      const hasSocial = Boolean(input.socialNetworkId);
      const hasDirect = Boolean(recipientId);

      if ((hasSocial && hasDirect) || (!hasSocial && !hasDirect)) {
        throw badRequest("Provide exactly one target: socialNetworkId OR recipientId");
      }

      ackOk(ack, { status: "queued" });

      void (async () => {
        try {
          await delay(2000);

          if (hasSocial) {
            const created = await createSocialNetworkMessageService(
              user.id,
              user.role,
              input.socialNetworkId as string,
              { content: input.content }
            );

            io.to(socialNetworkRoom(input.socialNetworkId as string)).emit("message", created);
            return;
          }

          const created = await createDirectMessageService(user.id, recipientId as string, { content: input.content });
          io.to(userRoom(user.id)).to(userRoom(recipientId as string)).emit("message", created);
        } catch (err) {
          logger.error({ err }, "Socket message persistence error");

          if (err instanceof HttpError) {
            socket.emit("messageError", { code: err.code, message: err.message, details: err.details });
          } else if (err instanceof Error && err.message === "UNAUTHORIZED") {
            socket.emit("messageError", { code: "UNAUTHORIZED", message: "Unauthorized" });
          } else {
            socket.emit("messageError", { code: "INTERNAL_ERROR", message: "Internal server error" });
          }
        }
      })();
    } catch (err) {
      logger.error({ err }, "Socket message handler error");
      ackErr(ack, err);
    }
  });

  socket.on("deleteMessage", async (raw: unknown, ack?: Ack) => {
    const user = (socket.data as any).user as SocketUser | undefined;

    try {
      if (!user?.id) throw new Error("UNAUTHORIZED");
      const input = deleteSchema.parse(raw);

      const existing = await getMessageById(input.id);
      if (!existing) throw notFound("Message not found");

      const deleted = await deleteMessageService({ requesterId: user.id, requesterRole: user.role, messageId: input.id });

      if (existing.socialNetworkId) {
        io.to(socialNetworkRoom(existing.socialNetworkId)).emit("messageDeleted", deleted);
      } else if (existing.recipientId) {
        io.to(userRoom(existing.senderId)).to(userRoom(existing.recipientId)).emit("messageDeleted", deleted);
      }

      ackOk(ack, deleted);
    } catch (err) {
      ackErr(ack, err);
    }
  });
}
