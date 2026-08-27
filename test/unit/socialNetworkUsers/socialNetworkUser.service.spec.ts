import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createSocialNetworkUser: jest.fn(),
  listSocialNetworkUsers: jest.fn(),
  getSocialNetworkUserById: jest.fn(),
  updateSocialNetworkUser: jest.fn(),
  deleteSocialNetworkUser: jest.fn(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/socialNetworkUsers.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/socialNetworkUsers/socialNetworkUser.service.js");

describe("socialNetworkUsers: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createSocialNetworkUserService validates required ids", async () => {
    await expect(svc.createSocialNetworkUserService({ socialNetworkId: "", userId: "" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("getSocialNetworkUserByIdService rejects when not found", async () => {
    repo.getSocialNetworkUserById.mockResolvedValue(null);
    await expect(svc.getSocialNetworkUserByIdService("x")).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
