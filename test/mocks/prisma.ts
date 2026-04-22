import { jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";

export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

