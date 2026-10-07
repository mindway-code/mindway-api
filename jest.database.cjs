const base = require("./jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "database",
  testMatch: ["<rootDir>/test/database/**/*.spec.ts"],
};
