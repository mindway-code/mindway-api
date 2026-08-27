export type FamilyMemberRole = "child" | "enterprise" | "manager" | "therapist" | "professional";

export type FamilyMember = {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyMemberRole;
  createdAt: Date;
  updatedAt: Date;

  user?: { id: string; name: string; email: string | null };
  family?: { id: string; name: string };
};

export type CreateFamilyMemberDTO = {
  userId: string;
  familyId: string;
  role: FamilyMemberRole;
};

export type UpdateFamilyMemberDTO = {
  userId?: string;
  familyId?: string;
  role?: FamilyMemberRole;
};

export type ListFamilyMembersParams = {
  familyId?: string;
  userId?: string;
  skip?: number;
  take?: number;
};

export type ListFamilyMembersResult = {
  items: FamilyMember[];
  total: number;
};

export type ListFamilyMembersResponse = {
  items: FamilyMember[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export type DeleteFamilyMemberResponse = { id: string };

