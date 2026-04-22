/** @type {import('jest').Config} */
module.exports = {
  projects: [
    "<rootDir>/jest.unit.cjs",
    "<rootDir>/jest.middlewares.cjs",
    "<rootDir>/jest.controllers.cjs",
    "<rootDir>/jest.integration.cjs",
  ],
};
