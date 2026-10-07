import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fileURLToPath } from "node:url";
import { forbidden } from "../../../src/core/errors/httpError.js";

const children = {
  getChildByIdService: jest.fn<(...args: any[]) => any>(),
};

const repository = {
  createAnamnesis: jest.fn<(...args: any[]) => any>(),
  deleteBehavior: jest.fn<(...args: any[]) => any>(),
  deleteBirth: jest.fn<(...args: any[]) => any>(),
  deleteHealth: jest.fn<(...args: any[]) => any>(),
  deleteLanguageCommunication: jest.fn<(...args: any[]) => any>(),
  deleteMotorDevelopment: jest.fn<(...args: any[]) => any>(),
  deleteRoutine: jest.fn<(...args: any[]) => any>(),
  getAnamnesisByChildId: jest.fn<(...args: any[]) => any>(),
  updateGeneralNotes: jest.fn<(...args: any[]) => any>(),
  upsertBehavior: jest.fn<(...args: any[]) => any>(),
  upsertBirth: jest.fn<(...args: any[]) => any>(),
  upsertHealth: jest.fn<(...args: any[]) => any>(),
  upsertLanguageCommunication: jest.fn<(...args: any[]) => any>(),
  upsertMotorDevelopment: jest.fn<(...args: any[]) => any>(),
  upsertRoutine: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/api/v1/modules/children/children.service.ts", import.meta.url)),
  () => children,
);
jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/anamnesis.repository.ts", import.meta.url)),
  () => repository,
);

const service = await import("../../../src/api/v1/modules/anamnesis/anamnesis.service.js");

describe("anamnesis: child access boundary", () => {
  beforeEach(() => {
    Object.values(children).forEach((mock) => mock.mockReset());
    Object.values(repository).forEach((mock) => mock.mockReset());
  });

  it("propagates child access denial before reading anamnesis data", async () => {
    children.getChildByIdService.mockRejectedValue(forbidden());

    await expect(
      service.getAnamnesisByChildIdService({ requesterId: "u2", requesterRole: "common", childId: "c1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.getAnamnesisByChildId).not.toHaveBeenCalled();
  });

  it("returns an existing anamnesis without creating a duplicate", async () => {
    children.getChildByIdService.mockResolvedValue({ id: "c1" });
    repository.getAnamnesisByChildId.mockResolvedValue({ id: "a1", childId: "c1" });

    await expect(
      service.createAnamnesisService({ requesterId: "owner", requesterRole: "common", childId: "c1" }),
    ).resolves.toEqual(expect.objectContaining({ id: "a1" }));
    expect(repository.createAnamnesis).not.toHaveBeenCalled();
  });
});
