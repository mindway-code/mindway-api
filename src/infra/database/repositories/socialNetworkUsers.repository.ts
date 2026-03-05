import { prisma } from "../prisma/client.js";
import type {
  SocialNetworkUserRecord,
  CreateSocialNetworkUserInput,
  ListSocialNetworkUsersParams,
  ListSocialNetworkUsersResult,
  UpdateSocialNetworkUserInput,
  DeleteSocialNetworkUserResult,
} from "../../../api/v1/modules/socialNetworkUsers/socialNetworkUser.types.js";

const socialNetworkUserSelect = {
  id: true,
  socialNetworkId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  socialNetwork: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
} as const;
export async function createSocialNetworkUser(
  input: CreateSocialNetworkUserInput
): Promise<SocialNetworkUserRecord> {
  const created = await prisma.socialNetworkUser.create({
    data: {
      socialNetworkId: input.socialNetworkId,
      userId: input.userId,
    },
    select: socialNetworkUserSelect,
  });

  return created as unknown as SocialNetworkUserRecord;
}
export async function listSocialNetworkUsers(
  params: ListSocialNetworkUsersParams = {}
): Promise<ListSocialNetworkUsersResult> {
  const { socialNetworkId, userId, skip = 0, take = 20 } = params;

  const where: any = {};
  if (socialNetworkId) where.socialNetworkId = socialNetworkId;
  if (userId) where.userId = userId;

  const [items, total] = await prisma.$transaction([
    prisma.socialNetworkUser.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: socialNetworkUserSelect,
    }),
    prisma.socialNetworkUser.count({ where }),
  ]);

  return { items: items as unknown as SocialNetworkUserRecord[], total };
}

export async function getSocialNetworkUserById(
  id: string
): Promise<SocialNetworkUserRecord | null> {
  return prisma.socialNetworkUser.findUnique({
    where: { id },
    select: socialNetworkUserSelect,
  }) as Promise<SocialNetworkUserRecord | null>;
}

export async function updateSocialNetworkUser(
  id: string,
  input: UpdateSocialNetworkUserInput
): Promise<SocialNetworkUserRecord> {
  const updated = await prisma.socialNetworkUser.update({
    where: { id },
    data: {
      ...(input.socialNetworkId !== undefined ? { socialNetworkId: input.socialNetworkId } : {}),
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
    },
    select: socialNetworkUserSelect,
  });

  return updated as unknown as SocialNetworkUserRecord;
}
export async function deleteSocialNetworkUser(
  id: string
): Promise<DeleteSocialNetworkUserResult> {
  const deleted = await prisma.socialNetworkUser.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createSocialNetworkUser,
  listSocialNetworkUsers,
  getSocialNetworkUserById,
  updateSocialNetworkUser,
  deleteSocialNetworkUser,
};
