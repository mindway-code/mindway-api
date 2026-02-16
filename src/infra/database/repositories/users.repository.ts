import { UserRole } from "../../../utils/crypto/jwt.js";
import { prisma } from "../prisma/client.js";


export type UserRecord = {
  id: string;
  email: string;
  password?: string | null;
  role?: UserRole | null;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { email } }) as Promise<UserRecord | null>;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id } }) as Promise<UserRecord | null>;
}

export type ListUsersResult = {
  items: UserRecord[];
  total: number;
};

export async function listUsers(params: { skip: number; take: number }): Promise<ListUsersResult> {
  const { skip, take } = params;

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    }),
    prisma.user.count(),
  ]);

  return { items: items as unknown as UserRecord[], total };
}

export default {
  findUserByEmail,
  findUserById,
};
