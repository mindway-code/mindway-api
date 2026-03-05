import { prisma } from "../prisma/client.js";
import type {
  UserRecord,
  UserAuthRecord,
  UserDTO,
  UpdateUserDTO,
  DeleteUserResult,
  ListUsersResult,
} from "../../../api/v1/modules/users/users.types.js";

const userSafeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userAuthSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  passwordHash: true,
} as const;

export async function findUserByEmail(email: string): Promise<UserAuthRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: userAuthSelect,
  }) as Promise<UserAuthRecord | null>;
}


export async function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({
    where: { id },
    select: userSafeSelect,
  }) as Promise<UserRecord | null>;
}

export async function getMe(userId: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSafeSelect,
  }) as Promise<UserRecord | null>;
}


export async function createUser(input: UserDTO): Promise<UserRecord> {
  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      passwordHash: input.passwordHash ?? null,
      role: input.role ?? undefined,
      provider: input.provider ? input.provider : "local",
      googleId: input.googleId ?? null,
    },
    select: userSafeSelect,
  });

  return created as unknown as UserRecord;
}


export async function updateUser(userId: string, input: UpdateUserDTO): Promise<UserRecord> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
      ...(input.googleId !== undefined ? { googleId: input.googleId } : {}),
    },
    select: userSafeSelect,
  });

  return updated as unknown as UserRecord;
}


export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  const deleted = await prisma.user.delete({
    where: { id: userId },
    select: { id: true },
  });

  return deleted;
}

export async function listUsers(params: { skip: number; take: number }): Promise<ListUsersResult> {
  const { skip, take } = params;

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: userSafeSelect,
    }),
    prisma.user.count(),
  ]);

  return { items: items as unknown as UserRecord[], total };
}



export default {
  findUserByEmail,
  findUserById,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
};
