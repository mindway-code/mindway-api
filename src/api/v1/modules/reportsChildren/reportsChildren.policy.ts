import type { UserRole } from "../../../../utils/crypto/jwt.js";
import type { ReportRevisionStatus } from "./reportsChildren.types.js";

export type ReportCapabilities = {
  canView: boolean;
  canEditDraft: boolean;
  canSubmit: boolean;
  canValidate: boolean;
  canCreateRevision: boolean;
  canArchive: boolean;
  canRevokeValidation: boolean;
};

export type ReportPolicyContext = {
  requesterId: string;
  requesterRole: UserRole;
  reportAuthorId: string;
  isResponsible: boolean;
  isSecondaryResponsible: boolean;
  isAssociated: boolean;
  currentStatus: ReportRevisionStatus;
  publishedRevisionNumber: number | null;
  archived: boolean;
};

export function decideReportCapabilities(context: ReportPolicyContext): ReportCapabilities {
  const isAdmin = context.requesterRole === "admin";
  const isAuthor = context.reportAuthorId === context.requesterId;
  const canView = !context.archived && (isAdmin || context.isResponsible || context.isSecondaryResponsible || context.isAssociated);
  const currentIsDraft = context.currentStatus === "DRAFT";
  const transitionIsFrozen = currentIsDraft || context.currentStatus === "SUBMITTED";

  return {
    canView,
    canEditDraft: canView && isAuthor && currentIsDraft,
    canSubmit: canView && isAuthor && currentIsDraft,
    canValidate: false,
    canCreateRevision: canView && isAuthor && context.publishedRevisionNumber !== null && !transitionIsFrozen,
    canArchive: canView && (isAuthor || isAdmin),
    canRevokeValidation: false,
  };
}

export default decideReportCapabilities;
