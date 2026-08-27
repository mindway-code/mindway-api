import {
  CreateAppointmentInput,
  AppointmentRecord,
  ListAppointmentsParams,
  ListAppointmentsResult,
  UpdateAppointmentInput,
  DeleteAppointmentResult
} from "../../../api/v1/modules/appointments/appointments.types.js";
import { prisma } from "../prisma/client.js";


const appointmentSelect = {
  id: true,
  therapistId: true,
  userId: true,
  status: true,
  title: true,
  startsAt: true,
  endsAt: true,
  note: true,
  feedback: true,
  createdAt: true,
  updatedAt: true,
  therapist: { select: { id: true, name: true, email: true } },
  user: { select: { id: true, name: true, email: true } },
} as const;

export async function createAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord> {
  const created = await prisma.appointment.create({
    data: {
      therapistId: input.therapistId,
      userId: input.userId,
      status: input.status ?? "scheduled",
      title: input.title ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      note: input.note ?? null,
      feedback: input.feedback ?? null,
    },
    select: appointmentSelect,
  });

  return created as unknown as AppointmentRecord;
}

export async function listAppointmentsByUser(
  userId: string,
  params: ListAppointmentsParams = {}
): Promise<ListAppointmentsResult> {
  const { status, skip = 0, take = 20 } = params;

  const where = status ? { userId, status } : { userId };

  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy: [{ startsAt: "asc" }],
      select: appointmentSelect,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { items: items as unknown as AppointmentRecord[], total };
}

export async function listAppointmentsByTherapist(
  therapistId: string,
  params: ListAppointmentsParams = {}
): Promise<ListAppointmentsResult> {
  const { status, skip = 0, take = 20 } = params;

  const where = status ? { therapistId, status } : { therapistId };

  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy: [{ startsAt: "asc" }],
      select: appointmentSelect,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { items: items as unknown as AppointmentRecord[], total };
}

export async function updateAppointment(id: string, input: UpdateAppointmentInput): Promise<AppointmentRecord> {
  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
    },
    select: appointmentSelect,
  });

  return updated as unknown as AppointmentRecord;
}

export async function deleteAppointment(id: string): Promise<DeleteAppointmentResult> {
  const deleted = await prisma.appointment.delete({
    where: { id },
    select: { id: true },
  });

  return deleted;
}

export default {
  createAppointment,
  listAppointmentsByUser,
  listAppointmentsByTherapist,
  updateAppointment,
  deleteAppointment,
};
