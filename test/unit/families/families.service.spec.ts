import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createFamily: jest.fn(),
  listFamilies: jest.fn(),
  listFamiliesByUserId: jest.fn(),
  getFamilyById: jest.fn(),
  updateFamily: jest.fn(),
  deleteFamily: jest.fn(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/families.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/families/families.service.js");

describe("families: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createFamilyService rejects empty name", async () => {
    await expect(svc.createFamilyService({ name: "   " } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updateFamilyService rejects when not found", async () => {
    repo.getFamilyById.mockResolvedValue(null);
    await expect(svc.updateFamilyService("f1", { name: "X" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("getFamilyByIdService returns existing", async () => {
    repo.getFamilyById.mockResolvedValue({ id: "f1" });
    await expect(svc.getFamilyByIdService("f1")).resolves.toEqual({ id: "f1" });
  });
});
