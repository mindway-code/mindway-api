import type { UserRole } from "../../../../utils/crypto/jwt.js";
import type { ReportCapabilities } from "./reportsChildren.policy.js";

export type ReportRevisionStatus = "LEGACY_UNVALIDATED" | "DRAFT" | "SUBMITTED" | "VALIDATED" | "REJECTED" | "SUPERSEDED";

export type ReportContentFields = {
  title: string;
  behavior: string | null;
  difficulty: string | null;
  recommendation: string | null;
};

export type ReportRevisionRecord = ReportContentFields & {
  id: string;
  reportId: string;
  revisionNumber: number;
  createdById: string;
  status: ReportRevisionStatus;
  contentHash: string;
  submittedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportAggregateRecord = {
  id: string;
  childId: string;
  userId: string;
  userRole: UserRole;
  currentRevisionNumber: number;
  publishedRevisionNumber: number | null;
  archivedAt: Date | null;
  archivedById: string | null;
  user: { id: string; name: string | null; email: string | null };
  revisions: ReportRevisionRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type ReportRevisionView = ReportContentFields & {
  id: string;
  revisionNumber: number;
  status: ReportRevisionStatus;
  submittedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportView = {
  id: string;
  childId: string;
  userRole: UserRole;
  author: { id: string; name: string | null; email: string | null };
  lifecycle: {
    status: ReportRevisionStatus;
    currentRevisionNumber: number;
    publishedRevisionNumber: number | null;
    hasUnpublishedChanges: boolean;
  };
  revision: ReportRevisionView;
  validation: null;
  capabilities: ReportCapabilities;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateReportsChildDTO = {
  title: string;
  behavior?: string | null;
  difficulty?: string | null;
  recommendation?: string | null;
  accessCode?: string;
};

export type UpdateReportsChildDTO = {
  title?: string;
  behavior?: string | null;
  difficulty?: string | null;
  recommendation?: string | null;
};

export type RejectReportDTO = { reason: string };

export type CreateReportWithRevisionInput = ReportContentFields & {
  childId: string;
  userId: string;
  userRole: UserRole;
  contentHash: string;
};

export type UpdateDraftRevisionInput = ReportContentFields & {
  reportId: string;
  revisionNumber: number;
  contentHash: string;
};

export type ListReportsChildrenParams = { skip?: number; take?: number };
export type ListReportsChildrenResult = { items: ReportAggregateRecord[]; total: number };
export type ListReportsChildrenResponse = {
  items: ReportView[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};
