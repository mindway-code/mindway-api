const base = require("./jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "controllers",
  testMatch: ["<rootDir>/test/controllers/**/*.spec.ts"],
};

