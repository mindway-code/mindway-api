export type SocialNetworkUserRecord = {
  id: string;
  socialNetworkId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  socialNetwork?: { id: string; name: string };
  user?: { id: string; name: string; email: string | null };
};

export type CreateSocialNetworkUserInput = {
  socialNetworkId: string;
  userId: string;
};

export type ListSocialNetworkUsersParams = {
  socialNetworkId?: string;
  userId?: string;
  skip?: number;
  take?: number;
};

export type ListSocialNetworkUsersResult = {
  items: SocialNetworkUserRecord[];
  total: number;
};

export type UpdateSocialNetworkUserInput = {
  socialNetworkId?: string;
  userId?: string;
};

export type DeleteSocialNetworkUserResult = { id: string };

export type CreateSocialNetworkUserDTO = {
  socialNetworkId: string;
  userId: string;
};

export type UpdateSocialNetworkUserDTO = {
  socialNetworkId?: string;
  userId?: string;
};

export type ListSocialNetworkUsersResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};
