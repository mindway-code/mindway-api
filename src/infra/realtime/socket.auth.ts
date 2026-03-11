import type { Socket } from "socket.io";
import { extractBearerToken, verifyAccessToken, type UserRole } from "../../utils/crypto/jwt.js";

export type SocketUser = {
  id: string;
  role: UserRole;
};

function readToken(socket: Socket): string | null {
  const authToken = (socket.handshake as any)?.auth?.token as string | undefined;
  if (authToken && typeof authToken === "string") return authToken;

  const header = socket.handshake.headers?.authorization as string | undefined;
  return extractBearerToken(header);
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = readToken(socket);
    if (!token) return next(new Error("UNAUTHORIZED"));

    const payload = verifyAccessToken(token);
    (socket.data as any).user = { id: payload.sub, role: payload.role } satisfies SocketUser;

    return next();
  } catch {
    return next(new Error("UNAUTHORIZED"));
  }
}

