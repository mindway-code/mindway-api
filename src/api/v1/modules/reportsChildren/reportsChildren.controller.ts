import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import {
  createReportForChildService,
  deleteReportService,
  getReportByIdService,
  listReportsByChildService,
  updateReportService,
} from "./reportsChildren.service.js";

export async function listReportsByChildController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { childId } = req.params as { childId: string };
    const { page, pageSize } = req.query;

    const result = await listReportsByChildService({
      requesterId,
      requesterRole,
      childId,
      pageRaw: page,
      pageSizeRaw: pageSize,
    });

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function createReportForChildController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { childId } = req.params as { childId: string };
    const dto = req.body as import("./reportsChildren.types.js").CreateReportsChildDTO;

    const created = await createReportForChildService({ requesterId, requesterRole, childId, dto });
    return sendSuccess(res, created, "Report created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function getReportByIdController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };

    const report = await getReportByIdService({ requesterId, requesterRole, reportId: id });
    return sendSuccess(res, report);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateReportController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };
    const dto = req.body as import("./reportsChildren.types.js").UpdateReportsChildDTO;

    const updated = await updateReportService({ requesterId, requesterRole, reportId: id, dto });
    return sendSuccess(res, updated, "Report updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteReportController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const requesterRole = req.user!.role;
    const { id } = req.params as { id: string };

    const deleted = await deleteReportService({ requesterId, requesterRole, reportId: id });
    return sendSuccess(res, deleted, "Report deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  listReportsByChildController,
  createReportForChildController,
  getReportByIdController,
  updateReportController,
  deleteReportController,
};

