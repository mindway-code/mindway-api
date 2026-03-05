import { prisma } from "../prisma/client.js";
import type {
  SocialNetworkRecord,
  CreateSocialNetworkInput,
  ListSocialNetworksParams,
  ListSocialNetworksResult,
  UpdateSocialNetworkInput,
  DeleteSocialNetworkResult,
} from "../../../api/v1/modules/socialNetworks/socialNetwork.types.js";

const socialNetworkSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  users: { select: { id: true, userId: true } },
} as const;
export async function createSocialNetwork(
  input: CreateSocialNetworkInput
): Promise<SocialNetworkRecord> {
  const created = await prisma.socialNetwork.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
    select: socialNetworkSelect,
  });

  return created as unknown as SocialNetworkRecord;
}


export async function listSocialNetworks(
  params: ListSocialNetworksParams = {}
): Promise<ListSocialNetworksResult> {
  const { skip = 0, take = 20 } = params;

  const [items, total] = await prisma.$transaction([
    prisma.socialNetwork.findMany({
      skip,
      take,
      orderBy: [{ createdAt: "desc" }],
      select: socialNetworkSelect,
    }),
    prisma.socialNetwork.count(),
  ]);

  return { items: items as unknown as SocialNetworkRecord[], total };
}

export async function updateSocialNetwork(
  id: string,
  input: UpdateSocialNetworkInput
): Promise<SocialNetworkRecord> {
  const updated = await prisma.socialNetwork.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    select: socialNetworkSelect,
  });

  return updated as unknown as SocialNetworkRecord;
}

export async function deleteSocialNetwork(
  id: string
): Promise<DeleteSocialNetworkResult> {
  const deleted = await prisma.socialNetwork.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createSocialNetwork,
  listSocialNetworks,
  updateSocialNetwork,
  deleteSocialNetwork,
};
