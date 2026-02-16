import { pagination } from "../../../../utils/pagination.js";
import { listUsers } from "../../../../infra/database/repositories/users.repository.js";

export type ListUsersResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export async function listUsersService(pageRaw: unknown, pageSizeRaw: unknown): Promise<ListUsersResponse> {
  const { page, pageSize, skip, take } = pagination(pageRaw, pageSizeRaw);

  const { items, total } = await listUsers({ skip, take });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    meta: { pagination: { page, pageSize, total, totalPages } },
  };
}

export default { listUsersService };
