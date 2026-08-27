import { prisma } from "../prisma/client.js";
import type { AuthUserRecord, CreateUserInput, RefreshTokenRow } from "../../../api/v1/modules/auth/auth.types.js";

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      provider: true,
      googleId: true,
    },
  }) as Promise<AuthUserRecord | null>;
}

export async function createLocalUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      provider: input.provider,
      googleId: input.googleId ?? null,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

export async function createRefreshTokenRow(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.refreshToken.create({
    data: {
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    },
    select: { id: true },
  });
}

export async function findActiveRefreshTokensByUserId(userId: string): Promise<RefreshTokenRow[]> {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, tokenHash: true },
    orderBy: { createdAt: "desc" },
  }) as Promise<RefreshTokenRow[]>;
}

export async function revokeRefreshTokenById(id: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
    select: { id: true },
  });
}

export default {
  findAuthUserByEmail,
  createLocalUser,
  createRefreshTokenRow,
  findActiveRefreshTokensByUserId,
  revokeRefreshTokenById,
};
