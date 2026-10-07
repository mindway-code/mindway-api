import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const svc = {
  createDirectMessageService: jest.fn<(...args: any[]) => any>(),
  createSocialNetworkMessageService: jest.fn<(...args: any[]) => any>(),
  deleteMessageService: jest.fn<(...args: any[]) => any>(),
  listDirectMessagesService: jest.fn<(...args: any[]) => any>(),
  listSocialNetworkMessagesService: jest.fn<(...args: any[]) => any>(),
};

jest.unstable_mockModule("../../src/api/v1/modules/messages/messages.service.js", () => svc);

const ctrl = await import("../../src/api/v1/modules/messages/messages.controller.js");

describe("controllers: messages", () => {
  beforeEach(() => {
    Object.values(svc).forEach((fn: any) => fn.mockReset());
  });

  it("listDirectMessagesController returns paginated data", async () => {
    svc.listDirectMessagesService.mockResolvedValue({ items: [{ id: "m1" }], meta: { pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 } } });
    const req = mockReq({ user: { id: "u1", role: "common" } as any, params: { userId: "u2" } as any, query: {} as any });
    const res = mockRes();
    await ctrl.listDirectMessagesController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ success: true, data: [{ id: "m1" }] }));
  });

  it("messagesOkController returns ok message", async () => {
    const req = mockReq();
    const res = mockRes();
    ctrl.messagesOkController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "Messages Routes Ok" }));
  });
});

