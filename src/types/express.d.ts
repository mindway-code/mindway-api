import type { UserRole } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      id?: string | number;
      user?: {
        id: string;
        role: UserRole;
      };
      stepUp?: {
        method: "TOTP" | "RECOVERY_CODE";
        factorId: string | null;
        idempotentReplay: boolean;
      };
    }
  }
}

export {};
