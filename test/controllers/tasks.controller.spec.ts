import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mockReq, mockRes } from "../helpers/express.js";

const tasksService = {
  createTaskService: jest.fn(),
  listTasksByUserService: jest.fn(),
  listTasksByTherapistService: jest.fn(),
  updateTaskService: jest.fn(),
  deleteTaskService: jest.fn(),
};

jest.unstable_mockModule("../../src/api/v1/modules/tasks/tasks.service.js", () => tasksService);

const ctrl = await import("../../src/api/v1/modules/tasks/tasks.controller.js");

describe("controllers: tasks", () => {
  beforeEach(() => {
    Object.values(tasksService).forEach((fn: any) => fn.mockReset());
  });

  it("listMyTasksController passes req.user.id", async () => {
    tasksService.listTasksByUserService.mockResolvedValue({ items: [], meta: { pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } } });
    const req = mockReq({ user: { id: "u1", role: "common" } as any, query: {} as any });
    const res = mockRes();
    await ctrl.listMyTasksController(req, res);
    expect(tasksService.listTasksByUserService).toHaveBeenCalledWith("u1", undefined, undefined, undefined);
  });

  it("deleteTaskController returns message", async () => {
    tasksService.deleteTaskService.mockResolvedValue({ id: "t1" });
    const req = mockReq({ params: { id: "t1" } as any });
    const res = mockRes();
    await ctrl.deleteTaskController(req, res);
    expect((res as any)._getJSONData()).toEqual(expect.objectContaining({ message: "Task deleted" }));
  });
});
