const base = require("./jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "unit",
  testMatch: ["<rootDir>/test/unit/**/*.spec.ts"],
};

