import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import {
  confirmTotpEnrollmentService,
  disableTotpService,
  getMfaStatusService,
  regenerateRecoveryCodesService,
  startTotpEnrollmentService,
  issueStepUpGrantService,
} from "./mfa.service.js";
import type {
  ConfirmTotpEnrollmentDTO,
  MfaProtectedActionDTO,
  StartTotpEnrollmentDTO,
  StepUpGrantDTO,
} from "./mfa.types.js";

export async function getMfaStatusController(req: Request, res: Response) {
  try {
    return sendSuccess(res, await getMfaStatusService(req.user!.id));
  } catch (error) {
    return sendError(res, error);
  }
}

export async function issueStepUpGrantController(req: Request, res: Response) {
  try {
    const data = await issueStepUpGrantService({
      userId: req.user!.id,
      ip: req.ip ?? "unknown",
      requestId: String(req.id ?? "unknown"),
      dto: req.body as StepUpGrantDTO,
    });
    return sendSuccess(res, data, "Step-up grant issued");
  } catch (error) {
    return sendError(res, error);
  }
}

export async function startTotpEnrollmentController(req: Request, res: Response) {
  try {
    const data = await startTotpEnrollmentService({
      userId: req.user!.id,
      ip: req.ip ?? "unknown",
      dto: req.body as StartTotpEnrollmentDTO,
    });
    return sendSuccess(res, data, "TOTP enrollment started");
  } catch (error) {
    return sendError(res, error);
  }
}

export async function confirmTotpEnrollmentController(req: Request, res: Response) {
  try {
    const data = await confirmTotpEnrollmentService({
      userId: req.user!.id,
      ip: req.ip ?? "unknown",
      enrollmentId: req.params.id!,
      dto: req.body as ConfirmTotpEnrollmentDTO,
    });
    return sendSuccess(res, data, "TOTP enrollment confirmed");
  } catch (error) {
    return sendError(res, error);
  }
}

export async function regenerateRecoveryCodesController(req: Request, res: Response) {
  try {
    const data = await regenerateRecoveryCodesService({
      userId: req.user!.id,
      ip: req.ip ?? "unknown",
      dto: req.body as MfaProtectedActionDTO,
    });
    return sendSuccess(res, data, "Recovery codes regenerated");
  } catch (error) {
    return sendError(res, error);
  }
}

export async function disableTotpController(req: Request, res: Response) {
  try {
    await disableTotpService({
      userId: req.user!.id,
      ip: req.ip ?? "unknown",
      dto: req.body as MfaProtectedActionDTO,
    });
    return sendSuccess(res, {}, "TOTP disabled");
  } catch (error) {
    return sendError(res, error);
  }
}
