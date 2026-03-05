export type SocialNetworkRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  users?: { id: string; userId: string }[];
};

export type CreateSocialNetworkInput = {
  name: string;
  description?: string | null;
};

export type ListSocialNetworksParams = {
  skip?: number;
  take?: number;
};

export type ListSocialNetworksResult = {
  items: SocialNetworkRecord[];
  total: number;
};

export type UpdateSocialNetworkInput = {
  name?: string;
  description?: string | null;
};

export type DeleteSocialNetworkResult = { id: string };

export type CreateSocialNetworkDTO = {
  name: string;
  description?: string | null;
};

export type UpdateSocialNetworkDTO = {
  name?: string;
  description?: string | null;
};

export type ListSocialNetworksResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};
