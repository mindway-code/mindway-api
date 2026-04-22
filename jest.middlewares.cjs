const base = require("./jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "middlewares",
  testMatch: ["<rootDir>/test/middlewares/**/*.spec.ts"],
};

