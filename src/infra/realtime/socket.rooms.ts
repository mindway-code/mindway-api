import type { Socket } from "socket.io";
import { forbidden } from "../../core/errors/httpError.js";
import { isSocialNetworkMember } from "../database/repositories/socialNetworkUsers.repository.js";
import type { SocketUser } from "./socket.auth.js";

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function socialNetworkRoom(socialNetworkId: string) {
  return `socialNetwork:${socialNetworkId}`;
}

export function joinUserRoom(socket: Socket) {
  const user = (socket.data as any).user as SocketUser | undefined;
  if (!user?.id) return;
  socket.join(userRoom(user.id));
}

export async function joinSocialNetworkRoom(socket: Socket, socialNetworkId: string) {
  const user = (socket.data as any).user as SocketUser | undefined;
  if (!user?.id) throw forbidden("Unauthorized");

  if (user.role !== "admin") {
    const ok = await isSocialNetworkMember(socialNetworkId, user.id);
    if (!ok) throw forbidden("You are not a member of this social network");
  }

  const room = socialNetworkRoom(socialNetworkId);
  socket.join(room);
  return room;
}

export async function leaveSocialNetworkRoom(socket: Socket, socialNetworkId: string) {
  const room = socialNetworkRoom(socialNetworkId);
  socket.leave(room);
  return room;
}

