import { describe, it, expect } from "@jest/globals";
import { pagination } from "../../../src/utils/pagination.js";

describe("utils: pagination", () => {
  it("clamps page and pageSize and computes skip/take", () => {
    expect(pagination("0", "999")).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 });
    expect(pagination("2", "10")).toEqual({ page: 2, pageSize: 10, skip: 10, take: 10 });
  });
});

