import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../utils/response.js";
import {
  createAppointmentService,
  listAppointmentsByUserService,
  listAppointmentsByTherapistService,
  updateAppointmentService,
  deleteAppointmentService,
} from "./appointment.service.js";
import type { AppointmentStatus } from "./appointments.types.js";

export async function createAppointmentController(req: Request, res: Response) {
  try {
    const created = await createAppointmentService(req.body);
    return sendSuccess(res, created, "Appointment created");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listMyAppointmentsController(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { page, pageSize, status } = req.query;

    const result = await listAppointmentsByUserService(
      userId,
      page,
      pageSize,
      status as AppointmentStatus | undefined
    );

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function listMyTherapistAppointmentsController(req: Request, res: Response) {
  try {
    const therapistId = req.user!.id;
    const { page, pageSize, status } = req.query;

    const result = await listAppointmentsByTherapistService(
      therapistId,
      page,
      pageSize,
      status as AppointmentStatus | undefined
    );

    return sendSuccess(res, result.items, undefined, { pagination: result.meta.pagination });
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateAppointmentController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const updated = await updateAppointmentService(id, req.body);
    return sendSuccess(res, updated, "Appointment updated");
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteAppointmentController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const deleted = await deleteAppointmentService(id);
    return sendSuccess(res, deleted, "Appointment deleted");
  } catch (err) {
    return sendError(res, err);
  }
}

export default {
  createAppointmentController,
  listMyAppointmentsController,
  listMyTherapistAppointmentsController,
  updateAppointmentController,
  deleteAppointmentController,
};
