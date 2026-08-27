import { pagination } from "../../../../utils/pagination.js";
import { buildCacheKey, getOrSetCached, invalidateCachePatterns } from "../../../../utils/cache.js";
import { badRequest, conflict, forbidden, notFound } from "../../../../core/errors/httpError.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import { generateAccessCode } from "../../../../utils/accessCode.js";
import { findUserById } from "../../../../infra/database/repositories/users.repository.js";
import {
  createChild,
  deleteChild,
  getChildByAccessCode,
  getChildById,
  getChildIdByAccessCode,
  listChildren,
  listChildrenAccessibleByUser,
  listMyAssociatedChildren,
  updateChild,
} from "../../../../infra/database/repositories/children.repository.js";
import type {
  ChildRecord,
  ChildWithAccessCodeRecord,
  CreateChildDTO,
  CreateChildInput,
  ListChildrenResponse,
  UpdateChildDTO,
  UpdateChildInput,
} from "./children.types.js";

export type ChildrenServiceDeps = {
  pagination: typeof pagination;
  badRequest: typeof badRequest;
  conflict: typeof conflict;
  forbidden: typeof forbidden;
  notFound: typeof notFound;
  generateAccessCode: typeof generateAccessCode;
  findUserById: typeof findUserById;
  createChild: typeof createChild;
  getChildById: typeof getChildById;
  getChildByAccessCode: typeof getChildByAccessCode;
  getChildIdByAccessCode: typeof getChildIdByAccessCode;
  listChildren: typeof listChildren;
  listChildrenAccessibleByUser: typeof listChildrenAccessibleByUser;
  listMyAssociatedChildren: typeof listMyAssociatedChildren;
  updateChild: typeof updateChild;
  deleteChild: typeof deleteChild;
};

const CHILDREN_CACHE_TTL_SECONDS = 300;
const CHILDREN_LIST_CACHE_PATTERN = "children:list:*";
const CHILDREN_ACCESSIBLE_CACHE_PATTERN = "children:accessible:*";

async function invalidateChildrenCache() {
  await invalidateCachePatterns([CHILDREN_LIST_CACHE_PATTERN, CHILDREN_ACCESSIBLE_CACHE_PATTERN]);
}

function parseDate(deps: ChildrenServiceDeps, raw: string | Date): Date {
  const date = typeof raw === "string" ? new Date(raw) : raw;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw deps.badRequest("Invalid birthDate");
  return date;
}

function canManageChild(role: UserRole, userId: string, child: { responsibleId: string; secondaryResponsibleId: string | null }) {
  if (role === "admin") return true;
  if (role !== "common") return false;
  return child.responsibleId === userId || child.secondaryResponsibleId === userId;
}

function canReadByAccessCode(role: UserRole) {
  return role === "admin" || role === "therapist" || role === "professional" || role === "enterprise";
}

async function generateUniqueCode(deps: ChildrenServiceDeps): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = deps.generateAccessCode(8);
    const existing = await deps.getChildIdByAccessCode(code);
    if (!existing) return code;
  }
  throw deps.conflict("Could not generate unique accessCode");
}

export function makeChildrenServices(deps: ChildrenServiceDeps) {
  async function createChildService(params: { requesterId: string; requesterRole: UserRole; dto: CreateChildDTO }): Promise<ChildWithAccessCodeRecord> {
    const { requesterId, requesterRole, dto } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");

    if (requesterRole !== "admin" && requesterRole !== "common") throw deps.forbidden();

    const responsibleIdRaw = dto.responsibleId?.trim();
    // For normal authenticated creation (profile flow), responsibleId must be derived from auth user.
    // Admins may optionally provide responsibleId to create for another user; if omitted, default to themselves.
    const responsibleId = requesterRole === "admin" ? (responsibleIdRaw || requesterId) : requesterId;
    if (!responsibleId) throw deps.badRequest("responsibleId is required");

    if (requesterRole !== "admin" && responsibleId !== requesterId) throw deps.forbidden();

    const responsible = await deps.findUserById(responsibleId);
    if (!responsible) throw deps.notFound("Responsible user not found");

    const secondaryResponsibleId = dto.secondaryResponsibleId ?? null;
    if (secondaryResponsibleId) {
      const secondary = await deps.findUserById(secondaryResponsibleId);
      if (!secondary) throw deps.notFound("Secondary responsible user not found");
    }

    const name = dto.name?.trim();
    if (!name) throw deps.badRequest("name is required");
    if (dto.age === undefined || dto.age === null) throw deps.badRequest("age is required");
    if (dto.birthDate === undefined || dto.birthDate === null) throw deps.badRequest("birthDate is required");

    const birthDate = parseDate(deps, dto.birthDate);

    const accessCode = await generateUniqueCode(deps);

    const input: CreateChildInput = {
      responsibleId,
      secondaryResponsibleId,
      name,
      age: dto.age,
      birthDate,
      observation: dto.observation ?? null,
      accessCode,
    };

    const created = await deps.createChild(input);
    await invalidateChildrenCache();

    return created;
  }

  async function listChildrenService(params: { requesterId: string; requesterRole: UserRole; pageRaw: unknown; pageSizeRaw: unknown }): Promise<ListChildrenResponse> {
    const { requesterId, requesterRole, pageRaw, pageSizeRaw } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");

    const { page, pageSize, skip, take } = deps.pagination(pageRaw, pageSizeRaw);
    const isAdmin = requesterRole === "admin";
    const scope = !isAdmin && requesterRole !== "common" ? "associated" : "managed";
    const cacheKey = buildCacheKey("children:list", [
      ["scope", scope],
      ["requesterId", requesterId],
      ["requesterRole", requesterRole],
      ["page", page],
      ["pageSize", pageSize],
    ]);

    return getOrSetCached({
      key: cacheKey,
      ttlSeconds: CHILDREN_CACHE_TTL_SECONDS,
      load: async () => {
        if (scope === "associated") {
          const { items, total } = await deps.listMyAssociatedChildren({ skip, take, requesterUserId: requesterId, isAdmin });
          const totalPages = Math.max(1, Math.ceil(total / pageSize));

          return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
        }

        const { items, total } = await deps.listChildren({ skip, take, requesterUserId: requesterId, isAdmin });
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return { items, meta: { pagination: { page, pageSize, total, totalPages } } };
      },
    });
  }

  async function listMyChildrenService(params: { requesterId: string }): Promise<ChildWithAccessCodeRecord[]> {
    const { requesterId } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");

    return getOrSetCached({
      key: buildCacheKey("children:accessible", [["requesterId", requesterId]]),
      ttlSeconds: CHILDREN_CACHE_TTL_SECONDS,
      load: () => deps.listChildrenAccessibleByUser(requesterId),
    });
  }

  async function getChildByIdService(params: { requesterId: string; requesterRole: UserRole; childId: string }): Promise<ChildWithAccessCodeRecord> {
    const { requesterId, requesterRole, childId } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!childId) throw deps.badRequest("childId is required");

    // if (requesterRole !== "admin" && requesterRole !== "common") throw deps.forbidden();

    const child = (await deps.getChildById(childId, { includeAccessCode: true })) as ChildWithAccessCodeRecord | null;
    if (!child) throw deps.notFound("Child not found");

    // if (!canManageChild(requesterRole, requesterId, child)) throw deps.forbidden();

    return child;
  }

  async function getChildByAccessCodeService(params: { requesterId: string; requesterRole: UserRole; accessCode: string }): Promise<ChildRecord> {
    const { requesterId, requesterRole, accessCode } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!accessCode) throw deps.badRequest("accessCode is required");

    if (!canReadByAccessCode(requesterRole)) throw deps.forbidden();

    const child = await deps.getChildByAccessCode(accessCode);
    if (!child) throw deps.notFound("Invalid accessCode");

    return child;
  }

  async function updateChildService(params: { requesterId: string; requesterRole: UserRole; childId: string; dto: UpdateChildDTO }): Promise<ChildWithAccessCodeRecord> {
    const { requesterId, requesterRole, childId, dto } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!childId) throw deps.badRequest("childId is required");

    if (requesterRole !== "admin" && requesterRole !== "common") throw deps.forbidden();

    const existing = (await deps.getChildById(childId, { includeAccessCode: true })) as ChildWithAccessCodeRecord | null;
    if (!existing) throw deps.notFound("Child not found");

    if (!canManageChild(requesterRole, requesterId, existing)) throw deps.forbidden();

    const input: UpdateChildInput = {
      ...(dto.secondaryResponsibleId !== undefined ? { secondaryResponsibleId: dto.secondaryResponsibleId } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.age !== undefined ? { age: dto.age } : {}),
      ...(dto.birthDate !== undefined ? { birthDate: parseDate(deps, dto.birthDate) } : {}),
      ...(dto.observation !== undefined ? { observation: dto.observation } : {}),
    };

    if (dto.name !== undefined && !input.name) throw deps.badRequest("name cannot be empty");

    if (input.secondaryResponsibleId) {
      const secondary = await deps.findUserById(input.secondaryResponsibleId);
      if (!secondary) throw deps.notFound("Secondary responsible user not found");
    }

    const updated = await deps.updateChild(childId, input);
    await invalidateChildrenCache();

    return updated;
  }

  async function deleteChildService(params: { requesterId: string; requesterRole: UserRole; childId: string }) {
    const { requesterId, requesterRole, childId } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");
    if (!childId) throw deps.badRequest("childId is required");

    if (requesterRole !== "admin" && requesterRole !== "common") throw deps.forbidden();

    const existing = (await deps.getChildById(childId, { includeAccessCode: true })) as ChildWithAccessCodeRecord | null;
    if (!existing) throw deps.notFound("Child not found");

    if (!canManageChild(requesterRole, requesterId, existing)) throw deps.forbidden();

    const deleted = await deps.deleteChild(childId);
    await invalidateChildrenCache();

    return deleted;
  }

  return {
    createChildService,
    listChildrenService,
    listMyChildrenService,
    getChildByIdService,
    getChildByAccessCodeService,
    updateChildService,
    deleteChildService,
  };
}

const defaultDeps: ChildrenServiceDeps = {
  pagination,
  badRequest,
  conflict,
  forbidden,
  notFound,
  generateAccessCode,
  findUserById,
  createChild,
  getChildById,
  getChildByAccessCode,
  getChildIdByAccessCode,
  listChildren,
  listChildrenAccessibleByUser,
  listMyAssociatedChildren,
  updateChild,
  deleteChild,
};

export const {
  createChildService,
  listChildrenService,
  listMyChildrenService,
  getChildByIdService,
  getChildByAccessCodeService,
  updateChildService,
  deleteChildService,
} = makeChildrenServices(defaultDeps);

export default {
  createChildService,
  listChildrenService,
  listMyChildrenService,
  getChildByIdService,
  getChildByAccessCodeService,
  updateChildService,
  deleteChildService,
};
