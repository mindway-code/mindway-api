import type { MfaMethod, SecurityAuditOutcome } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export type SecurityAuditEventInput = {
  actorUserId?: string | null;
  eventType: string;
  outcome: SecurityAuditOutcome;
  method?: MfaMethod | null;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
};

export async function createSecurityAuditEvent(input: SecurityAuditEventInput): Promise<void> {
  await prisma.securityAuditEvent.create({ data: input });
}

export default { createSecurityAuditEvent };
