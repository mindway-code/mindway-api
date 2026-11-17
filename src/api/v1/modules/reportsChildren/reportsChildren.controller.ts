import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import {
  createNextRevisionService,
  createReportForChildService,
  deleteReportService,
  getReportByIdService,
  listReportsByChildService,
  listRevisionHistoryService,
  rejectReportService,
  submitReportService,
  updateReportService,
} from "./reportsChildren.service.js";
import type { CreateReportsChildDTO, RejectReportDTO, UpdateReportsChildDTO } from "./reportsChildren.types.js";

function requester(req: Request) {
  return { requesterId: req.user!.id, requesterRole: req.user!.role };
}

export async function listReportsByChildController(req: Request, res: Response) {
  try {
    const result = await listReportsByChildService({
      ...requester(req),
      childId: req.params.childId!,
      pageRaw: req.query.page,
      pageSizeRaw: req.query.pageSize,
    });
    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (error) { return sendError(res, error); }
}

export async function createReportForChildController(req: Request, res: Response) {
  try {
    const report = await createReportForChildService({ ...requester(req), childId: req.params.childId!, dto: req.body as CreateReportsChildDTO });
    return sendSuccess(res, report, "Report draft created");
  } catch (error) { return sendError(res, error); }
}

export async function getReportByIdController(req: Request, res: Response) {
  try { return sendSuccess(res, await getReportByIdService({ ...requester(req), reportId: req.params.id! })); }
  catch (error) { return sendError(res, error); }
}

export async function updateReportController(req: Request, res: Response) {
  try {
    const report = await updateReportService({ ...requester(req), reportId: req.params.id!, dto: req.body as UpdateReportsChildDTO });
    return sendSuccess(res, report, "Report draft updated");
  } catch (error) { return sendError(res, error); }
}

export async function submitReportController(req: Request, res: Response) {
  try { return sendSuccess(res, await submitReportService({ ...requester(req), reportId: req.params.id! }), "Report submitted"); }
  catch (error) { return sendError(res, error); }
}

export async function createNextRevisionController(req: Request, res: Response) {
  try { return sendSuccess(res, await createNextRevisionService({ ...requester(req), reportId: req.params.id! }), "Report revision created"); }
  catch (error) { return sendError(res, error); }
}

export async function rejectReportController(req: Request, res: Response) {
  try {
    const report = await rejectReportService({ ...requester(req), reportId: req.params.id!, dto: req.body as RejectReportDTO });
    return sendSuccess(res, report, "Report revision rejected");
  } catch (error) { return sendError(res, error); }
}

export async function listRevisionHistoryController(req: Request, res: Response) {
  try { return sendSuccess(res, await listRevisionHistoryService({ ...requester(req), reportId: req.params.id! })); }
  catch (error) { return sendError(res, error); }
}

export async function deleteReportController(req: Request, res: Response) {
  try { return sendSuccess(res, await deleteReportService({ ...requester(req), reportId: req.params.id! }), "Report archived"); }
  catch (error) { return sendError(res, error); }
}
