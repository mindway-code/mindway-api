import { describe, it, expect } from "@jest/globals";
import { createChildSchema, updateChildSchema, validateAccessCodeBodySchema } from "../../../src/api/v1/validators/children.validator.js";

describe("validators: children", () => {
  it("createChildSchema accepts minimal payload", () => {
    const parsed = createChildSchema.parse({ name: "Kid", age: 8, birthDate: "2020-01-01" });
    expect(parsed).toEqual(expect.objectContaining({ name: "Kid", age: 8 }));
  });

  it("updateChildSchema allows partial updates", () => {
    const parsed = updateChildSchema.parse({ observation: null });
    expect(parsed).toEqual({ observation: null });
  });

  it("validateAccessCodeBodySchema enforces length", () => {
    expect(() => validateAccessCodeBodySchema.parse({ accessCode: "A" })).toThrow();
  });
});

