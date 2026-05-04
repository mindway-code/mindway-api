import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createSocialNetwork: jest.fn(),
  listSocialNetworks: jest.fn(),
  updateSocialNetwork: jest.fn(),
  deleteSocialNetwork: jest.fn(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/socialNetworks.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/socialNetworks/socialNetwork.service.js");

describe("socialNetworks: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createSocialNetworkService rejects empty name", async () => {
    await expect(svc.createSocialNetworkService({ name: "   " } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updateSocialNetworkService rejects empty name when provided", async () => {
    await expect(svc.updateSocialNetworkService("sn1", { name: "   " } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
