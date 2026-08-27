/** @type {import('jest').Config} */
module.exports = {
  // ESM + TypeScript project ("type": "module", tsconfig: NodeNext)
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  rootDir: __dirname,

  // Ensure required env vars exist before any module imports env.ts
  setupFiles: ["<rootDir>/test/setup/env.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.ts"],

  // Resolve TS sources that import other TS files using ".js" specifiers (NodeNext pattern)
  resolver: "<rootDir>/test/setup/jest.resolver.cjs",

  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  clearMocks: true,
  restoreMocks: true,

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
};
