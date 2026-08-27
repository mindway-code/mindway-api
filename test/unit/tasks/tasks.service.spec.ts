import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fileURLToPath } from "node:url";

const repo = {
  createTask: jest.fn(),
  listTasksByUser: jest.fn(),
  listTasksByTherapist: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
};

jest.unstable_mockModule(
  fileURLToPath(new URL("../../../src/infra/database/repositories/tasks.repository.ts", import.meta.url)),
  () => repo,
);

const svc = await import("../../../src/api/v1/modules/tasks/tasks.service.js");

describe("tasks: service", () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn: any) => fn.mockReset());
  });

  it("createTaskService validates required fields", async () => {
    await expect(svc.createTaskService({} as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updateTaskService rejects empty id", async () => {
    await expect(svc.updateTaskService("", { status: "pending" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updateTaskService rejects missing status", async () => {
    await expect(svc.updateTaskService("t1", {} as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("listTasksByUserService calls repository", async () => {
    repo.listTasksByUser.mockResolvedValue({ items: [], total: 0 });
    const result = await svc.listTasksByUserService("u1", 1, 10, "pending" as any);
    expect(result).toEqual(expect.objectContaining({ items: [] }));
  });
});
