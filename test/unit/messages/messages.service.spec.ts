import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  isSocialNetworkMember: jest.fn<(...args: any[]) => any>(),
  createDirectMessage: jest.fn<(...args: any[]) => any>(),
  createSocialNetworkMessage: jest.fn<(...args: any[]) => any>(),
  deleteMessage: jest.fn<(...args: any[]) => any>(),
  getMessageById: jest.fn<(...args: any[]) => any>(),
  listDirectMessagesBetweenUsers: jest.fn<(...args: any[]) => any>(),
  listSocialNetworkMessages: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/socialNetworkUsers.repository.ts", import.meta.url)),
  () => ({ isSocialNetworkMember: repo.isSocialNetworkMember }),
);
jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/messages.repository.ts", import.meta.url)),
  () => ({
    createDirectMessage: repo.createDirectMessage,
    createSocialNetworkMessage: repo.createSocialNetworkMessage,
    deleteMessage: repo.deleteMessage,
    getMessageById: repo.getMessageById,
    listDirectMessagesBetweenUsers: repo.listDirectMessagesBetweenUsers,
    listSocialNetworkMessages: repo.listSocialNetworkMessages,
  }),
);

const svc = await import("../../../src/api/v1/modules/messages/messages.service.js");

describe("messages: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createDirectMessageService rejects when sender==recipient", async () => {
    await expect(svc.createDirectMessageService("u1", "u1", { content: "x" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("createSocialNetworkMessageService requires membership for non-admin", async () => {
    repo.isSocialNetworkMember.mockResolvedValue(false);
    await expect(
      svc.createSocialNetworkMessageService("u1", "common" as any, "sn1", { content: "x" } as any),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("createSocialNetworkMessageService bypasses membership for admin", async () => {
    repo.createSocialNetworkMessage.mockResolvedValue({ id: "m1" });
    const result = await svc.createSocialNetworkMessageService("a1", "admin" as any, "sn1", { content: " hi " } as any);
    expect(result).toEqual({ id: "m1" });
    expect(repo.isSocialNetworkMember).not.toHaveBeenCalled();
  });

  it("listSocialNetworkMessagesService requires membership for non-admin", async () => {
    repo.isSocialNetworkMember.mockResolvedValue(false);
    await expect(svc.listSocialNetworkMessagesService("u1", "common" as any, "sn1", 1, 10)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("deleteMessageService allows sender", async () => {
    repo.getMessageById.mockResolvedValue({ id: "m1", senderId: "u1" });
    repo.deleteMessage.mockResolvedValue({ id: "m1" });
    await expect(svc.deleteMessageService({ requesterId: "u1", requesterRole: "common" as any, messageId: "m1" })).resolves.toEqual({ id: "m1" });
  });
});
