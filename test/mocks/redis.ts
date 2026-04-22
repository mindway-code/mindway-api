import { jest } from "@jest/globals";

export const redisMock = {
  cacheData: jest.fn(),
  getCachedData: jest.fn(),
  deleteCacheKeys: jest.fn(),
  deleteCacheByPattern: jest.fn(),
};

