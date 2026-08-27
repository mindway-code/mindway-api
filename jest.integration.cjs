const base = require("./jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "integration",
  testMatch: ["<rootDir>/test/integration/**/*.spec.ts"],
};

