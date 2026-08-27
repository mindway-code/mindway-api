import { badRequest, notFound } from "../../../../core/errors/httpError.js";
import { invalidateCachePatterns } from "../../../../utils/cache.js";
import { getChildByAccessCodeWithAccessCode } from "../../../../infra/database/repositories/children.repository.js";
import {
  createAssociationChild,
  findAssociationByUserAndChild,
} from "../../../../infra/database/repositories/associationChildren.repository.js";
import type {
  AssociateChildResult,
  CreateAssociationChildDTO,
} from "./associationChildren.types.js";

const CHILDREN_CACHE_PATTERNS = ["children:list:*", "children:accessible:*"];

export type AssociationChildrenServiceDeps = {
  badRequest: typeof badRequest;
  notFound: typeof notFound;
  getChildByAccessCodeWithAccessCode: typeof getChildByAccessCodeWithAccessCode;
  findAssociationByUserAndChild: typeof findAssociationByUserAndChild;
  createAssociationChild: typeof createAssociationChild;
};

function isUniqueConstraintError(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "P2002";
}

async function invalidateAssociationChildrenCache() {
  await invalidateCachePatterns(CHILDREN_CACHE_PATTERNS);
}

export function makeAssociationChildrenServices(deps: AssociationChildrenServiceDeps) {
  async function associateByAccessCodeService(params: {
    requesterId: string;
    dto: CreateAssociationChildDTO;
  }): Promise<AssociateChildResult> {
    const { requesterId, dto } = params;
    if (!requesterId) throw deps.badRequest("requesterId is required");

    const accessCode = dto?.accessCode?.trim();
    if (!accessCode) throw deps.badRequest("accessCode is required");

    const child = await deps.getChildByAccessCodeWithAccessCode(accessCode);
    if (!child) throw deps.notFound("Invalid child access code.");

    const alreadyResponsible =
      child.responsibleId === requesterId || child.secondaryResponsibleId === requesterId;
    if (alreadyResponsible) {
      return { child, association: null, alreadyHadAccess: true };
    }

    const existing = await deps.findAssociationByUserAndChild(requesterId, child.id);
    if (existing) {
      return { child, association: existing, alreadyHadAccess: true };
    }

    try {
      const created = await deps.createAssociationChild(requesterId, child.id);
      await invalidateAssociationChildrenCache();
      return { child, association: created, alreadyHadAccess: false };
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;

      const afterConflict = await deps.findAssociationByUserAndChild(requesterId, child.id);
      if (afterConflict) await invalidateAssociationChildrenCache();
      return { child, association: afterConflict ?? null, alreadyHadAccess: true };
    }
  }

  return { associateByAccessCodeService };
}

const defaultDeps: AssociationChildrenServiceDeps = {
  badRequest,
  notFound,
  getChildByAccessCodeWithAccessCode,
  findAssociationByUserAndChild,
  createAssociationChild,
};

export const { associateByAccessCodeService } = makeAssociationChildrenServices(defaultDeps);

export default { associateByAccessCodeService };
