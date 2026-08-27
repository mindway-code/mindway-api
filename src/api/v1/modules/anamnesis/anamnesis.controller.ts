import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import type { UserRole } from "../../../../utils/crypto/jwt.js";
import {
  createAnamnesisService,
  deleteBehaviorService,
  deleteBirthService,
  deleteHealthService,
  deleteLanguageCommunicationService,
  deleteMotorDevelopmentService,
  deleteRoutineService,
  getAnamnesisByChildIdService,
  updateGeneralNotesService,
  upsertBehaviorService,
  upsertBirthService,
  upsertHealthService,
  upsertLanguageCommunicationService,
  upsertMotorDevelopmentService,
  upsertRoutineService,
} from "./anamnesis.service.js";

function requester(req: Request) {
  return { requesterId: req.user!.id as string, requesterRole: req.user!.role as UserRole };
}

export async function getAnamnesisByChildIdController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const data = await getAnamnesisByChildIdService({ ...requester(req), childId });
    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createAnamnesisController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const created = await createAnamnesisService({ ...requester(req), childId });
    return sendSuccess(res, created, "Anamnesis created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateGeneralNotesController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpdateAnamnesisGeneralNotesDTO;
    const updated = await updateGeneralNotesService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "General notes updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertBirthController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisBirthDTO;
    const updated = await upsertBirthService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Birth updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteBirthController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteBirthService({ ...requester(req), childId });
    return sendSuccess(res, null, "Birth deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertMotorDevelopmentController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisMotorDevelopmentDTO;
    const updated = await upsertMotorDevelopmentService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Motor development updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteMotorDevelopmentController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteMotorDevelopmentService({ ...requester(req), childId });
    return sendSuccess(res, null, "Motor development deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertLanguageCommunicationController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisLanguageCommunicationDTO;
    const updated = await upsertLanguageCommunicationService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Language communication updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteLanguageCommunicationController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteLanguageCommunicationService({ ...requester(req), childId });
    return sendSuccess(res, null, "Language communication deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertHealthController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisHealthDTO;
    const updated = await upsertHealthService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Health updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteHealthController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteHealthService({ ...requester(req), childId });
    return sendSuccess(res, null, "Health deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertBehaviorController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisBehaviorDTO;
    const updated = await upsertBehaviorService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Behavior updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteBehaviorController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteBehaviorService({ ...requester(req), childId });
    return sendSuccess(res, null, "Behavior deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function upsertRoutineController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./anamnesis.types.js").UpsertAnamnesisRoutineDTO;
    const updated = await upsertRoutineService({ ...requester(req), childId, dto });
    return sendSuccess(res, updated, "Routine updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteRoutineController(req: Request, res: Response) {
  try {
    const { childId } = req.params as { childId: string };
    await deleteRoutineService({ ...requester(req), childId });
    return sendSuccess(res, null, "Routine deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  getAnamnesisByChildIdController,
  createAnamnesisController,
  updateGeneralNotesController,
  upsertBirthController,
  deleteBirthController,
  upsertMotorDevelopmentController,
  deleteMotorDevelopmentController,
  upsertLanguageCommunicationController,
  deleteLanguageCommunicationController,
  upsertHealthController,
  deleteHealthController,
  upsertBehaviorController,
  deleteBehaviorController,
  upsertRoutineController,
  deleteRoutineController,
};
