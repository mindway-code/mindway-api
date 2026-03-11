import type http from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../../core/logger/logger.js";
import { corsOptions } from "../../core/config/cors.js";
import { socketAuthMiddleware } from "./socket.auth.js";
import { joinUserRoom } from "./socket.rooms.js";
import { registerMessageEvents } from "./socket.events.js";

let io: SocketIOServer | null = null;

export function initSocket(server: http.Server) {
  if (io) return io;

  const cors = corsOptions();

  io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: cors.origin,
      credentials: cors.credentials,
      methods: [...cors.methods],
      allowedHeaders: [...cors.allowedHeaders],
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userId = (socket.data as any)?.user?.id as string | undefined;
    logger.info({ socketId: socket.id, userId }, "Socket connected");

    joinUserRoom(socket);
    registerMessageEvents(io as SocketIOServer, socket);

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export async function closeSocket(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => io!.close(() => resolve()));
  io = null;
}

