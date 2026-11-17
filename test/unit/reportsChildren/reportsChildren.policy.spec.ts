import { describe, expect, it } from "@jest/globals";
import { decideReportCapabilities } from "../../../src/api/v1/modules/reportsChildren/reportsChildren.policy.js";

const base = {
  requesterId: "author",
  requesterRole: "professional" as const,
  reportAuthorId: "author",
  isResponsible: false,
  isSecondaryResponsible: false,
  isAssociated: true,
  publishedRevisionNumber: null,
  archived: false,
};

describe("report revision capabilities", () => {
  it("allows only an author to edit and submit a current draft", () => {
    expect(decideReportCapabilities({ ...base, currentStatus: "DRAFT" })).toEqual({
      canView: true,
      canEditDraft: true,
      canSubmit: true,
      canValidate: false,
      canCreateRevision: false,
      canArchive: true,
      canRevokeValidation: false,
    });
    expect(decideReportCapabilities({ ...base, requesterId: "viewer", currentStatus: "DRAFT" })).toEqual(
      expect.objectContaining({ canView: true, canEditDraft: false, canSubmit: false }),
    );
  });

  it.each(["LEGACY_UNVALIDATED", "SUBMITTED", "VALIDATED", "REJECTED", "SUPERSEDED"] as const)(
    "keeps %s frozen",
    (currentStatus) => {
      expect(decideReportCapabilities({ ...base, currentStatus })).toEqual(
        expect.objectContaining({ canEditDraft: false, canSubmit: false }),
      );
    },
  );

  it("offers a new revision only when a publication exists and no transition is active", () => {
    expect(decideReportCapabilities({ ...base, currentStatus: "VALIDATED", publishedRevisionNumber: 1 }).canCreateRevision).toBe(true);
    expect(decideReportCapabilities({ ...base, currentStatus: "SUBMITTED", publishedRevisionNumber: 1 }).canCreateRevision).toBe(false);
  });

  it("removes every capability from archived reports", () => {
    expect(decideReportCapabilities({ ...base, currentStatus: "DRAFT", archived: true })).toEqual({
      canView: false,
      canEditDraft: false,
      canSubmit: false,
      canValidate: false,
      canCreateRevision: false,
      canArchive: false,
      canRevokeValidation: false,
    });
  });
});
