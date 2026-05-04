import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createFamilyMember: jest.fn(),
  listFamilyMembers: jest.fn(),
  getFamilyMemberById: jest.fn(),
  updateFamilyMember: jest.fn(),
  deleteFamilyMember: jest.fn(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/familyMembers.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/familyMembers/familyMember.service.js");

describe("familyMembers: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createFamilyMemberService validates required fields", async () => {
    await expect(svc.createFamilyMemberService({ userId: "", familyId: "", role: null } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("getFamilyMemberByIdService rejects when missing", async () => {
    await expect(svc.getFamilyMemberByIdService("" as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
