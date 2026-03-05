import type { UserRole } from "../../../../utils/crypto/jwt.js";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterResult = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  provider?: "local" | "google";
  googleId?: string | null;
};

// Types previously declared in the repository — moved here as single source of truth
export type AuthUserRecord = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  passwordHash: string | null;
  provider: "local" | "google";
  googleId: string | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  provider: "local" | "google";
  googleId?: string | null;
};

export type RefreshTokenRow = {
  id: string;
  tokenHash: string;
};
